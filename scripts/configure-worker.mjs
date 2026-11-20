import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Contains deployment configuration, never copied into dist or the browser build.
const configPath = new URL('../worker/wrangler.jsonc', import.meta.url);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_D1_DATABASE_ID', 'APP_ORIGIN', 'GOOGLE_CLIENT_ID', 'OWNER_EMAILS'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing server deployment setting: ${key} (value suppressed).`);
const app = new URL(process.env.APP_ORIGIN);
if (app.protocol !== 'https:' || app.origin !== process.env.APP_ORIGIN) throw new Error('APP_ORIGIN must be an HTTPS origin.');
if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(process.env.GOOGLE_CLIENT_ID)) throw new Error('Invalid Google client ID.');
if (!/^[0-9a-f-]{36}$/.test(process.env.CLOUDFLARE_D1_DATABASE_ID)) throw new Error('Invalid D1 ID.');
config.d1_databases[0].database_id = process.env.CLOUDFLARE_D1_DATABASE_ID;
for (const key of ['APP_ORIGIN', 'GOOGLE_CLIENT_ID']) config.vars[key] = process.env[key];
// Wrangler prints plain vars in deployment logs, which are public for this repo.
const secrets = {};
for (const key of ['OWNER_EMAILS', 'TEACHER_EMAILS', 'EDITOR_EMAILS', 'STUDENT_EMAILS']) {
  delete config.vars[key];
  secrets[key] = process.env[key] ?? '';
}
mkdirSync(new URL('../worker/.wrangler/', import.meta.url), { recursive: true });
writeFileSync(new URL('../worker/.wrangler/deploy-secrets.json', import.meta.url), JSON.stringify(secrets) + '\n', { mode: 0o600 });
config.routes = [{ pattern: app.hostname, custom_domain: true }];
writeFileSync(new URL('../worker/wrangler.production.json', import.meta.url), JSON.stringify(config, null, 2) + '\n');
console.log('Server deployment configuration prepared. Values suppressed.');
