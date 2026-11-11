#!/usr/bin/env node
// Regenerates tools.json (the fixed tool list served by index.js) from the
// public Apify API: each Actor's current Store price and its published input
// schema (default build). Run it after a price change or an input change:
//   node scripts/build-tools.mjs
// Only the price in force today is written; future prices are never shown as current.
import { writeFileSync } from 'node:fs';

const API = 'https://api.apify.com/v2';

// One tool per Actor. `fields` = the main output fields named in the description.
const ACTORS = [
    {
        actor: 'ats-jobs-scraper', tool: 'ats_jobs_scraper', title: 'ATS Jobs Scraper (live company job postings)',
        returns: 'one JSON item per open job',
        fields: ['company', 'ats', 'title', 'department', 'location', 'countryCode', 'workplaceType', 'employmentType', 'seniority', 'salaryMin', 'salaryMax', 'salaryCurrency (when the posting has a salary)', 'postedAt', 'url', 'applyUrl', 'descriptionText'],
        example: { companies: ['anthropic', 'https://jobs.lever.co/spotify'], maxJobsPerCompany: 5, keywords: ['engineer'] },
    },
    {
        actor: 'company-enrichment-from-website', tool: 'company_enrichment_from_website', title: 'Company Enrichment from Website',
        returns: 'one JSON item per company (one per domain)', unit: 'company',
        fields: ['domain', 'companyName', 'description', 'country', 'emails (generic/role)', 'phones (E.164)', 'primaryEmail', 'primaryPhone', 'socialProfiles', 'address', 'technologies', 'hiring', 'latestPosts', 'contactPageUrl'],
        example: { domains: ['stripe.com', 'notion.so'] },
    },
    {
        actor: 'app-store-google-play-reviews', tool: 'app_store_google_play_reviews', title: 'App Store & Google Play Reviews',
        returns: 'one JSON item per review',
        fields: ['store', 'appId', 'appName', 'country', 'language', 'rating', 'title', 'text', 'date', 'appVersion', 'authorName', 'developerReply', 'thumbsUp', 'url'],
        example: { apps: ['https://play.google.com/store/apps/details?id=com.duolingo'], maxReviewsPerApp: 20 },
    },
    {
        actor: 'fmcsa-carrier-data', tool: 'fmcsa_carrier_data', title: 'FMCSA Carrier Data (US trucking companies)',
        returns: 'one JSON item per carrier',
        fields: ['dotNumber', 'mcNumbers', 'legalName', 'dbaName', 'entityType', 'usdotStatus', 'authorityStatus', 'physicalAddress', 'phone', 'email', 'powerUnits', 'drivers', 'cargoCarried', 'insurancePolicies (when on file)', 'safetyRating', 'addDate', 'fmcsaUrl'],
        example: { states: ['TX'], addedWithinDays: 7, maxResults: 10 },
    },
    {
        actor: 'latam-public-tenders', tool: 'latam_public_tenders', title: 'Latin America Public Tenders',
        returns: 'one JSON item per public tender',
        fields: ['tenderId', 'country', 'source', 'title', 'titleEn', 'description', 'buyer', 'categories', 'procedureType', 'status', 'amount (local currency and USD)', 'publishedDate', 'closingDate', 'awardees', 'documents', 'url'],
        example: { countries: ['CO'], sectors: ['it-software'], status: ['open'], maxResults: 10 },
    },
];

const TIER_ORDER = ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

async function get(path) {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return (await res.json()).data;
}

const usd = (n) => `USD ${Number(n.toFixed(6))}`;
const per1000 = (n) => `USD ${Number((n * 1000).toFixed(4))} per 1,000`;
// Only real HTML tags are removed: placeholders such as <company> in URLs stay.
const stripHtml = (s) => String(s ?? '').replace(/<\/?(a|b|i|u|em|strong|code|pre|br|p|ul|ol|li|span|div|small)(\s[^>]*)?\/?>/gi, '').replace(/[ \t]+\n/g, '\n').trim();

function pricingAt(act, now) {
    const infos = [...(act.pricingInfos || [])].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
    const current = infos.filter((p) => new Date(p.startedAt).getTime() <= now).at(-1);
    if (!current || current.pricingModel !== 'PAY_PER_EVENT') throw new Error(`${act.name}: no current pay-per-event price`);
    const next = infos.find((p) => new Date(p.startedAt).getTime() > now);
    return { current, next };
}

function tierText(ev) {
    if (!ev.eventTieredPricingUsd) return usd(ev.eventPriceUsd);
    const prices = TIER_ORDER.map((t) => ev.eventTieredPricingUsd[t]?.tieredEventPriceUsd).filter((x) => x != null);
    const min = Math.min(...prices);
    return `${usd(prices[0])} on the Apify Free plan${min < prices[0] ? ` (down to ${usd(min)} on higher plans)` : ''}`;
}
const freePrice = (ev) => (ev.eventTieredPricingUsd ? ev.eventTieredPricingUsd.FREE?.tieredEventPriceUsd : ev.eventPriceUsd);

// Returns { main, perRun, optional[] } as text.
function priceText(pricing, unit) {
    const events = pricing.pricingPerEvent.actorChargeEvents;
    const out = { main: '', perRun: '', optional: [] };
    for (const [key, ev] of Object.entries(events)) {
        if (key === 'apify-default-dataset-item') out.main = `${tierText(ev)} per ${unit} (${per1000(freePrice(ev))} on the Free plan)`;
        else if (key === 'apify-actor-start') out.perRun = `${usd(freePrice(ev))} per run (Actor start, per GB of memory, minimum one)`;
        else out.optional.push(`${ev.eventTitle}: ${tierText(ev)}${ev.eventDescription ? ` (${stripHtml(ev.eventDescription).replace(/\.$/, '')})` : ''}`);
    }
    if (!out.main) throw new Error('no apify-default-dataset-item event');
    return out;
}

function convertProp(p) {
    const out = { type: p.type };
    let desc = [p.title, stripHtml(p.description)].filter(Boolean).join('. ');
    if (p.enum) {
        out.enum = p.enum;
        if (p.enumTitles) desc += `\nOptions: ${p.enum.map((v, i) => `${v} = ${p.enumTitles[i] ?? v}`).join('; ')}.`;
    }
    if (p.type === 'array') {
        if (p.items) {
            const it = { type: p.items.type };
            if (p.items.enum) it.enum = p.items.enum;
            if (p.items.enumTitles) desc += `\nOptions: ${p.items.enum.map((v, i) => `${v} = ${p.items.enumTitles[i] ?? v}`).join('; ')}.`;
            out.items = it;
        } else if (p.editor === 'stringList') out.items = { type: 'string' };
        else if (p.editor === 'requestListSources') out.items = { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] };
    }
    if (p.editor === 'datepicker') desc += '\nFormat: YYYY-MM-DD.';
    out.description = desc;
    for (const k of ['default', 'minimum', 'maximum']) if (p[k] !== undefined) out[k] = p[k];
    const ex = p.example ?? p.prefill;
    if (ex !== undefined) out.examples = [ex];
    return out;
}

const now = Date.now();
const tools = [];
for (const cfg of ACTORS) {
    const [act, build] = await Promise.all([get(`/acts/cleanyield~${cfg.actor}`), get(`/acts/cleanyield~${cfg.actor}/builds/default`)]);
    const schema = typeof build.inputSchema === 'string' ? JSON.parse(build.inputSchema) : build.inputSchema;
    const { current: pricing, next } = pricingAt(act, now);
    const unit = cfg.unit ?? cfg.returns.replace(/^one JSON item per (open |public )?/, '');
    const properties = Object.fromEntries(Object.entries(schema.properties).map(([k, p]) => [k, convertProp(p)]));
    for (const k of Object.keys(cfg.example)) if (!properties[k]) throw new Error(`${cfg.actor}: example uses unknown field ${k}`);
    const prices = priceText(pricing, unit);
    const day = (d) => new Date(d).toISOString().slice(0, 10);
    let priceLine = `Price charged today (Apify Store, pay per result, checked ${day(now)}): ${prices.main}`;
    if (prices.perRun) priceLine += `, plus ${prices.perRun}`;
    priceLine += '.';
    if (next) {
        const n = priceText(next, unit);
        if (n.main !== prices.main) priceLine += ` From ${day(next.startedAt)} the price per ${unit} changes to ${n.main.replace(/ per .*$/, '')}.`;
    }
    if (prices.optional.length) priceLine += ` Optional extras, charged only when you turn them on: ${prices.optional.join('; ')}.`;
    priceLine += ' Failed or not-found inputs are not charged. Needs APIFY_TOKEN.';
    const description = [
        `${stripHtml(act.description)}`,
        `Runs the Apify Actor cleanyield/${cfg.actor} (https://apify.com/cleanyield/${cfg.actor}) on your Apify account and returns ${cfg.returns}. Main fields: ${cfg.fields.join(', ')}.`,
        priceLine,
        `Example arguments: ${JSON.stringify(cfg.example)}`,
    ].join('\n');
    tools.push({
        name: cfg.tool,
        title: cfg.title,
        description,
        actor: `cleanyield/${cfg.actor}`,
        actorId: act.id,
        inputSchema: {
            type: 'object',
            description: stripHtml(schema.description),
            properties,
            ...(schema.required?.length ? { required: schema.required } : {}),
            examples: [cfg.example],
        },
        annotations: { title: cfg.title, readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        source: { build: build.buildNumber, pricingStartedAt: pricing.startedAt, nextPricingStartsAt: next?.startedAt ?? null },
    });
    console.error(`${cfg.tool}: build ${build.buildNumber}, ${Object.keys(properties).length} inputs, price from ${pricing.startedAt}: ${prices.main}${next ? ` (next price from ${next.startedAt})` : ''}`);
}
writeFileSync(new URL('../tools.json', import.meta.url), `${JSON.stringify({ generatedAt: new Date(now).toISOString(), tools }, null, 2)}\n`);
console.error('tools.json written');
