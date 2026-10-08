import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('delivers private account lists as secrets, outside public deployment configuration and output', () => {
  // Exercise the same CLI boundary as Actions, with exclusively synthetic accounts.
  const taskRoot = mkdtempSync(join(tmpdir(), 'ontleedlab-deploy-test-'));
  try {
    mkdirSync(join(taskRoot, 'scripts'));
    mkdirSync(join(taskRoot, 'worker'));
    copyFileSync(resolve('scripts/configure-worker.mjs'), join(taskRoot, 'scripts/configure-worker.mjs'));
    copyFileSync(resolve('worker/wrangler.jsonc'), join(taskRoot, 'worker/wrangler.jsonc'));
    const accounts = {
      OWNER_EMAILS: 'owner@example.invalid',
      TEACHER_EMAILS: 'teacher@example.invalid,another@example.invalid',
      EDITOR_EMAILS: '',
      STUDENT_EMAILS: '',
    };
    const output = execFileSync(process.execPath, [join(taskRoot, 'scripts/configure-worker.mjs')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ...accounts,
        CLOUDFLARE_ACCOUNT_ID: '00000000000000000000000000000000',
        CLOUDFLARE_API_TOKEN: 'synthetic-deploy-token-only',
        CLOUDFLARE_D1_DATABASE_ID: '00000000-0000-4000-8000-000000000000',
        APP_ORIGIN: 'https://school.example',
        GOOGLE_CLIENT_ID: 'synthetic.apps.googleusercontent.com',
      },
    });
    const configText = readFileSync(join(taskRoot, 'worker/wrangler.production.json'), 'utf8');
    const config = JSON.parse(configText);
    expect(configText).not.toContain('synthetic-deploy-token-only');
    for (const [key, value] of Object.entries(accounts)) {
      expect(config.vars).not.toHaveProperty(key);
      if (value) {
        expect(configText).not.toContain(value);
        expect(output).not.toContain(value);
      }
    }
    const secretsPath = join(taskRoot, 'worker/.wrangler/deploy-secrets.json');
    expect(existsSync(secretsPath)).toBe(true);
    expect(JSON.parse(readFileSync(secretsPath, 'utf8'))).toEqual(accounts);
    expect(config.vars.APP_ORIGIN).toBe('https://school.example');
    expect(config.d1_databases[0].database_id).toBe('00000000-0000-4000-8000-000000000000');
  } finally {
    // Check the absolute deletion target before recursively removing this test's directory.
    if (dirname(resolve(taskRoot)) !== resolve(tmpdir()) || !taskRoot.startsWith(join(tmpdir(), 'ontleedlab-deploy-test-'))) {
      throw new Error('Unexpected temporary test directory.');
    }
    rmSync(taskRoot, { recursive: true, force: true });
  }
});
