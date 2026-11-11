// Smoke test without any key: initialize, tools/list (5 tools), ping, tools/call -> isError.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const env = { ...process.env };
delete env.APIFY_TOKEN;
const proc = spawn(process.execPath, [new URL('../index.js', import.meta.url).pathname], { env, stdio: ['pipe', 'pipe', 'inherit'] });
const lines = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'ping' },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'ats_jobs_scraper', arguments: { companies: ['anthropic'] } } },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'does_not_exist', arguments: {} } },
];
proc.stdin.end(lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
let out = '';
proc.stdout.on('data', (d) => { out += d; });
proc.on('exit', (code) => {
    assert.equal(code, 0);
    const msgs = Object.fromEntries(out.trim().split('\n').map((l) => JSON.parse(l)).map((m) => [m.id, m]));
    assert.equal(msgs[1].result.serverInfo.name, 'clean-yield');
    const tools = msgs[2].result.tools;
    assert.deepEqual(tools.map((t) => t.name).sort(), ['app_store_google_play_reviews', 'ats_jobs_scraper', 'company_enrichment_from_website', 'fmcsa_carrier_data', 'latam_public_tenders']);
    for (const t of tools) {
        assert.equal(t.inputSchema.type, 'object');
        assert.ok(Object.keys(t.inputSchema.properties).length > 10, `${t.name} inputs`);
        assert.match(t.description, /Price charged today .*USD/);
        assert.ok(t.inputSchema.examples?.length, `${t.name} example`);
        for (const k of Object.keys(t.inputSchema.examples[0])) assert.ok(t.inputSchema.properties[k], `${t.name} example field ${k}`);
    }
    assert.deepEqual(msgs[3].result, {});
    assert.equal(msgs[4].result.isError, true);
    assert.match(msgs[4].result.content[0].text, /API & Integrations/);
    assert.equal(msgs[5].error.code, -32602);
    console.log(`ok: ${tools.length} tools listed without a key; tools/call without a key returns isError`);
});
