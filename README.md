# Clean Yield MCP Server: company data, FMCSA carriers, app reviews, jobs & public tenders

<!-- mcp-name: io.github.cleanyield-data/clean-yield -->

[![Clean Yield Data Tools MCP server](https://mcprush.com/badge/clean-yield-data-tools-mcp/card.svg)](https://mcprush.com/to/clean-yield-data-tools-mcp?ref=badge)

Give your AI agent five reliable data tools through one MCP server. Every tool returns clean, normalized, schema-validated JSON, and **you only pay for valid results** (pay per result on your own Apify account, no subscription).

| Tool (Apify Actor) | What your agent gets |
|---|---|
| [`cleanyield/ats-jobs-scraper`](https://apify.com/cleanyield/ats-jobs-scraper) | Every open job of any company, live from its ATS board: **Greenhouse, Lever, Ashby, Workday, SAP SuccessFactors, iCIMS, Oracle Recruiting Cloud, Eightfold, Phenom, Recruitee, Personio, Teamtailor, BambooHR** and more. Title, location, remote/hybrid, dates, apply URL, full description; salary when the posting has one. |
| [`cleanyield/company-enrichment-from-website`](https://apify.com/cleanyield/company-enrichment-from-website) | One row per domain: generic/role emails, E.164 phones, social profiles, tech stack, hiring signals, latest posts. |
| [`cleanyield/app-store-google-play-reviews`](https://apify.com/cleanyield/app-store-google-play-reviews) | **App Store and Google Play reviews** in one schema: rating, text, date, version, developer reply. |
| [`cleanyield/fmcsa-carrier-data`](https://apify.com/cleanyield/fmcsa-carrier-data) | **US trucking companies** from official FMCSA open data: USDOT/MC, authority, insurance, fleet, new carriers. |
| [`cleanyield/latam-public-tenders`](https://apify.com/cleanyield/latam-public-tenders) | **Latin American public tenders** from official open data (Colombia, Brazil, Chile, Paraguay; Uruguay in beta): buyer, amount in local currency and USD, deadline, awards, documents, UNSPSC category, English titles. |

Tool names in the local server: `ats_jobs_scraper`, `company_enrichment_from_website`, `app_store_google_play_reviews`, `fmcsa_carrier_data` and `latam_public_tenders`. Each tool description says exactly which fields it returns and what it costs today, and its input schema is the Actor's published input with examples.

The server starts and lists its tools without any key, so you (or your agent) can inspect everything first. Running a tool uses your own Apify token: calls go to **Apify's official MCP server** ([apify/apify-mcp-server](https://github.com/apify/apify-mcp-server), MIT), limited to these five Actors, and the rows of each run come back in the same answer. Nothing runs on our side: your token goes only to Apify.

## Quick start (remote, no install)

Add this to your MCP client (Claude Desktop, Cursor, VS Code, Windsurf...). Clients with OAuth open an Apify sign-in on first use:

```json
{
  "mcpServers": {
    "clean-yield": {
      "url": "https://mcp.apify.com/?tools=cleanyield/company-enrichment-from-website,cleanyield/fmcsa-carrier-data,cleanyield/app-store-google-play-reviews,cleanyield/ats-jobs-scraper,cleanyield/latam-public-tenders"
    }
  }
}
```

Without OAuth, add `"headers": { "Authorization": "Bearer <APIFY_TOKEN>" }`.

## Local (stdio)

```json
{
  "mcpServers": {
    "clean-yield": {
      "command": "npx",
      "args": ["-y", "clean-yield-mcp"],
      "env": { "APIFY_TOKEN": "<APIFY_TOKEN>" }
    }
  }
}
```

The server starts and answers `tools/list` without `APIFY_TOKEN`; a tool call without it returns a short message explaining how to get one. Get your token in Apify Console > Settings > API & Integrations (the free plan includes USD 5 of usage per month). Requires Node.js 22+.

Optional: `CLEAN_YIELD_MAX_ITEMS` (default 100) sets how many rows of each run are returned in the answer; the full results always stay in the run's dataset on your Apify account.

Docker: `docker build -t clean-yield-mcp .` and `docker run -i --rm -e APIFY_TOKEN=<APIFY_TOKEN> clean-yield-mcp` (without `-e APIFY_TOKEN` it still starts and lists the tools).

## Example prompts

- "List all open engineering jobs at Anthropic, Ramp and Notion with salary ranges."
- "Enrich these 20 domains with emails, phones and tech stack and tell me which ones are hiring."
- "Get the last 200 one-star Google Play and App Store reviews of Duolingo in the US and group them by topic."
- "Find trucking companies in Texas that got their USDOT number in the last 7 days."
- "Find open IT and software government tenders in Colombia and Brazil closing in the next two weeks, with amounts in USD."

## Pricing

Each tool charges per valid result on your Apify account (see each Actor page for the current price: [ATS Jobs](https://apify.com/cleanyield/ats-jobs-scraper), [Company Enrichment](https://apify.com/cleanyield/company-enrichment-from-website), [App Reviews](https://apify.com/cleanyield/app-store-google-play-reviews), [FMCSA Carriers](https://apify.com/cleanyield/fmcsa-carrier-data), [Public Tenders](https://apify.com/cleanyield/latam-public-tenders)). Failed requests, not-found inputs and incomplete items are never charged, and runs stop at your spending limit. Every Actor also has a free Lite version on the Store (same name with `-lite`, up to 25 results per run) to try it before using it from your agent.

## Maintainers

The tool list lives in `tools.json`, generated from the public Apify API (current Store price and published input schema of each Actor): `npm run build:tools`. Run it after any price or input change; a scheduled price change is shown as "From <date>", never as today's price. `npm test` checks the server without a key.

## License

MIT for this preset. Each Actor is a paid service on the Apify Store, subject to Apify's terms.
