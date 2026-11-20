import { describe, expect, it } from 'vitest';
import { assetFindings, frontendFindings, validateFrontendEnv, secretFindings } from './security-check.mjs';

describe('security regression gates', () => {
  it('rejects frontend secret config, browser auth flags, query credentials and direct storage calls', () => {
    for (const code of ["import.meta.env.VITE_API_KEY", "sessionStorage.getItem('usage-pin-ok')", "url.searchParams.set('naam', name)", "fetch('https://script.google.com/exec')"]) expect(frontendFindings(code, '/src/unsafe.ts').length).toBeGreaterThan(0);
    expect(frontendFindings("fetch('/api/reports', { method: 'POST' })", '/src/services/secureApi.ts')).toEqual([]);
  });
  it('refuses Vite exposure regardless of value or injection source', () => {
    expect(() => validateFrontendEnv({ VITE_DREX_API_KEY: 'synthetic-only' })).toThrow();
    expect(() => validateFrontendEnv({ VITE_OTHER: 'synthetic-only' })).toThrow();
    expect(() => validateFrontendEnv({ DREX_API_KEY: 'synthetic-only' })).not.toThrow();
  });
  it('finds synthetic secrets in assets but never needs a production key', () => {
    const sentinel = 'SYNTHETIC_BACKEND_SECRET_FOR_TEST';
    expect(assetFindings(`const secret = '${sentinel}'`, [sentinel])).toBe(true);
    expect(assetFindings('DREX_API_KEY')).toBe(true);
    expect(assetFindings("fetch('/api/reports')")).toBe(false);
    expect(secretFindings('nace_sk_' + 'a'.repeat(43))).toBe(true);
  });
});
