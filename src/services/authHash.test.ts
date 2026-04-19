import { describe, it, expect } from 'vitest';
import { sha256 } from './authHash';

describe('sha256', () => {
  it('geeft een hex-string van 64 tekens terug', async () => {
    const hash = await sha256('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('geeft dezelfde hash voor dezelfde invoer', async () => {
    const a = await sha256('1234');
    const b = await sha256('1234');
    expect(a).toBe(b);
  });

  it('geeft een andere hash voor andere invoer', async () => {
    const a = await sha256('1234');
    const b = await sha256('4321');
    expect(a).not.toBe(b);
  });

  it('behandelt een lege string', async () => {
    const hash = await sha256('');
    expect(hash).toHaveLength(64);
  });

  it('is hoofdletter-gevoelig', async () => {
    const lower = await sha256('geheim');
    const upper = await sha256('GEHEIM');
    expect(lower).not.toBe(upper);
  });
});
