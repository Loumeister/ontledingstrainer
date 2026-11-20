import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const secretPatterns = [
  /nace_sk_[A-Za-z0-9_-]{40,}/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /\bgithub_pat_[A-Za-z0-9_]{50,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
export function secretFindings(content) { return secretPatterns.some(pattern => pattern.test(content)); }
export function frontendFindings(content, filename) {
  const findings = [];
  if (/VITE_(?:[A-Z_]*(?:KEY|SECRET|TOKEN|PASSWORD|HASH)|APPS_SCRIPT_URL)\b/.test(content)) findings.push('secret-like frontend configuration');
  if (/pin-ok|authHash|script\.google\.com|apiKey=/.test(content)) findings.push('legacy browser security boundary');
  if (/sessionStorage/.test(content)) findings.push('sessionStorage requires explicit security review');
  if (/searchParams\.set\(['"](?:naam|name|initiaal|klas|code|token|apiKey|password|studentId)['"]/.test(content)) findings.push('sensitive query parameter');
  const ast = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true, filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'fetch' && !filename.replaceAll('\\', '/').endsWith('/services/secureApi.ts')) findings.push('browser network call outside own API adapter');
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (secretFindings(content)) findings.push('credential pattern');
  return findings;
}
export function validateFrontendEnv(env) {
  // This app uses same-origin /api and needs no frontend build variables.
  const forbidden = Object.keys(env).filter(key => key.startsWith('VITE_'));
  if (forbidden.length) throw new Error('Unsupported frontend environment variable; see SECURITY.md. Values suppressed.');
}
export function assetFindings(content, sentinels = []) {
  return /DREX_API_KEY|GOOGLE_CLIENT_SECRET|CLIENT_SECRET|BACKEND_SHARED_SECRET|VITE_API_KEY|VITE_\w*HASH|nace_sk_/.test(content) || secretFindings(content) || sentinels.some(value => value.length >= 8 && content.includes(value));
}
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);
}
export function checkSource() {
  const failures = [];
  for (const file of files(resolve(root, 'src')).filter(path => /\.(tsx?|js)$/.test(path) && !/\.test\./.test(path))) {
    for (const finding of frontendFindings(readFileSync(file, 'utf8'), file)) failures.push(`${relative(root, file)}: ${finding}`);
  }
  for (const file of files(resolve(root, '.github/workflows'))) {
    if (/VITE_\w*\s*:/.test(readFileSync(file, 'utf8'))) failures.push(`${relative(root, file)}: frontend build environment injection`);
  }
  return failures;
}
export function checkAssets(directory = resolve(root, 'dist')) {
  if (!existsSync(directory)) throw new Error('Production assets are missing; build first.');
  const secrets = Object.entries(process.env).filter(([key]) => /KEY|SECRET|TOKEN|PASSWORD/.test(key)).map(([, value]) => value ?? '');
  // Also compare ignored local .env values, without printing any value.
  for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
    const path = resolve(root, name);
    if (existsSync(path)) for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([\w]+)\s*=\s*(.*?)\s*$/);
      if (match && /KEY|SECRET|TOKEN|PASSWORD/.test(match[1])) secrets.push(match[2].replace(/^['"]|['"]$/g, ''));
    }
  }
  return files(directory).filter(file => /\.(js|css|html|json|map)$/.test(file)).filter(file => assetFindings(readFileSync(file, 'utf8'), secrets)).map(file => `${relative(root, file)}: credential pattern or secret value`);
}
export function checkGit(history = false) {
  // Local pattern scan is intentionally narrow. Full redacted Gitleaks runs in CI.
  const blobs = new Map();
  if (history) {
    const lines = execFileSync('git', ['rev-list', '--objects', '--all'], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).split('\n');
    for (const line of lines) { const split = line.indexOf(' '); if (split > 0) blobs.set(line.slice(0, split), line.slice(split + 1)); }
  } else {
    const paths = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
    return paths.filter(path => existsSync(resolve(root, path)) && secretFindings(readFileSync(resolve(root, path), 'utf8'))).map(path => `${path}: credential pattern`);
  }
  const failures = [];
  const entries = [...blobs.entries()];
  const checks = execFileSync('git', ['cat-file', '--batch-check'], { cwd: root, input: entries.map(([oid]) => oid).join('\n') + '\n', encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] }).trim().split('\n');
  const selected = entries.filter(([, path], index) => {
    if (/^\.env(?:\.|$)/.test(path) && !path.endsWith('.example')) failures.push(`${path}: environment file in local history`);
    const [, type, size] = checks[index].split(' ');
    return type === 'blob' && Number(size) <= 2000000;
  });
  for (let start = 0; start < selected.length; start += 100) {
    const batch = selected.slice(start, start + 100);
    const output = execFileSync('git', ['cat-file', '--batch'], { cwd: root, input: batch.map(([oid]) => oid).join('\n') + '\n', maxBuffer: 220 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] });
    let offset = 0;
    for (const [oid, path] of batch) {
      const lineEnd = output.indexOf(10, offset);
      const size = Number(output.toString('utf8', offset, lineEnd).split(' ')[2]);
      const content = output.toString('utf8', lineEnd + 1, lineEnd + 1 + size);
      if (secretFindings(content)) failures.push(`${path} (${oid.slice(0, 8)}): credential pattern in local history`);
      offset = lineEnd + size + 2;
    }
  }
  return [...new Set(failures)];
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  const failures = mode === 'assets' ? checkAssets() : mode === 'history' ? checkGit(true) : mode === 'git' ? checkGit() : checkSource();
  if (failures.length) { failures.forEach(failure => console.error(failure)); process.exitCode = 1; }
  else console.log(`Security ${mode ?? 'source'} check passed (matched values are never printed).`);
}
