import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { postReport, fetchReports, shouldAutoSendReport } from './googleDriveSync';
import { encodeReport } from './sessionReport';

beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true }))));
afterEach(() => vi.unstubAllGlobals());
describe('own API boundary', () => {
  it('posts allowlisted telemetry with cookies and without identifying data or query', async () => {
    const code = encodeReport({ v: 1, name: 'Emma', initiaal: 'V', klas: '2a', ts: '2026-09-30T09:00:00.000Z', c: 1, t: 2, lvl: 1, err: {}, sids: [1] });
    await postReport('Emma', 'V', '2a', code);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/reports');
    expect(options).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(JSON.parse(options!.body as string)).toEqual({ report: { v: 1, ts: '2026-09-30T09:00:00.000Z', c: 1, t: 2, lvl: 1, err: {}, sids: [1] } });
    expect(options!.body).not.toContain('Emma');
    expect(options!.body).not.toContain('2a');
  });
  it('fails closed without propagating backend internal details', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: 'secret-stack-detail' }, { status: 401 }));
    await expect(fetchReports()).rejects.toThrow('Aanmelden vereist');
  });
  it('never enables the legacy Apps Script route', () => {
    expect(shouldAutoSendReport({ name: '', initiaal: '', klas: '' }, '/api')).toBe(true);
    expect(shouldAutoSendReport({ name: 'a', initiaal: 'b', klas: 'c' }, 'https://script.google.com/macros/s/abc/exec')).toBe(false);
  });
  it('fetches authorized pages using POST JSON cursors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ rows: [{ id: 'one' }], nextCursor: 'page2' })).mockResolvedValueOnce(Response.json({ rows: [{ id: 'two' }], nextCursor: null }));
    expect(await fetchReports()).toEqual([{ id: 'one' }, { id: 'two' }]);
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/teacher/reports');
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string)).toEqual({ cursor: 'page2' });
  });
});
