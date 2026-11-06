# Clean Yield MCP Server: company data, FMCSA carriers, app reviews, jobs & public tenders

<!-- mcp-name: io.github.cleanyield-data/clean-yield -->

Give your AI agent five reliable data tools through one MCP server. Every tool returns clean, normalized, schema-validated JSON, and **you only pay for valid results** (pay per result on your own Apify account, no subscription).

| Tool (Apify Actor) | What your agent gets |
|---|---|
| [`cleanyield/ats-jobs-scraper`](https://apify.com/cleanyield/ats-jobs-scraper) | Every open job of any company on **Greenhouse, Lever, Ashby, Workday, Recruitee, Personio or Teamtailor**, live: structured salary, location, remote/hybrid, dates, full description. |
| [`cleanyield/company-enrichment-from-website`](https://apify.com/cleanyield/company-enrichment-from-website) | One row per domain: generic/role emails, E.164 phones, social profiles, tech stack, hiring signals, latest posts. |
| [`cleanyield/app-store-google-play-reviews`](https://apify.com/cleanyield/app-store-google-play-reviews) | **App Store and Google Play reviews** in one schema: rating, text, date, version, developer reply. |
| [`cleanyield/fmcsa-carrier-data`](https://apify.com/cleanyield/fmcsa-carrier-data) | **US trucking companies** from official FMCSA open data: USDOT/MC, authority, insurance, fleet, new carriers. |
| [`cleanyield/latam-public-tenders`](https://apify.com/cleanyield/latam-public-tenders) | **Latin American public tenders** from official open data (Colombia, Brazil, Chile, Paraguay; Uruguay in beta): buyer, amount in local currency and USD, deadline, awards, documents, UNSPSC category, English titles. |

This server is a thin, transparent preset of **Apify's official MCP server** ([apify/apify-mcp-server](https://github.com/apify/apify-mcp-server), MIT) limited to these five tools. Nothing runs on our side: your token goes only to Apify.

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

Get your token in Apify Console > Settings > API & Integrations. Requires Node.js 22+.

## Example prompts

- "List all open engineering jobs at Anthropic, Ramp and Notion with salary ranges."
- "Enrich these 20 domains with emails, phones and tech stack and tell me which ones are hiring."
- "Get the last 200 one-star Google Play and App Store reviews of Duolingo in the US and group them by topic."
- "Find trucking companies in Texas that got their USDOT number in the last 7 days."
- "Find open IT and software government tenders in Colombia and Brazil closing in the next two weeks, with amounts in USD."

## Pricing

Each tool charges per valid result on your Apify account (see each Actor page for the current price). Failed requests, not-found inputs and incomplete items are never charged, and runs stop at your spending limit.

## License

MIT for this preset. Each Actor is a paid service on the Apify Store, subject to Apify's terms.
