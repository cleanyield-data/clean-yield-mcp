#!/usr/bin/env node
// Clean Yield MCP server (stdio). Starts Apify's official MCP server
// (@apify/actors-mcp-server, MIT) limited to the five Clean Yield Actors.
// Needs APIFY_TOKEN in the environment. No other dependencies.
import { spawn } from 'node:child_process';

const TOOLS = [
    'cleanyield/company-enrichment-from-website',
    'cleanyield/fmcsa-carrier-data',
    'cleanyield/app-store-google-play-reviews',
    'cleanyield/ats-jobs-scraper',
    'cleanyield/latam-public-tenders',
].join(',');

if (!process.env.APIFY_TOKEN) {
    console.error('clean-yield-mcp: set APIFY_TOKEN (Apify Console > Settings > API & Integrations).');
    process.exit(1);
}

const child = spawn(process.env.APIFY_MCP_BIN || 'npx', process.env.APIFY_MCP_BIN ? ['--tools', TOOLS] : ['-y', '@apify/actors-mcp-server@0.20.2', '--tools', TOOLS], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
});
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
