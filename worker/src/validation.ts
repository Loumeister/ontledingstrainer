import { ApiError } from './types';

const fail = (): never => { throw new ApiError(400, 'Ongeldige invoer.'); };
export function object(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(key => !allowed.includes(key))) return fail();
  return data;
}
export function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\x00-\x1f\x7f]/.test(value)) return fail();
  return value.trim();
}
export function studentId(value: unknown): string {
  const id = text(value, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) return fail();
  return id;
}
function integer(value: unknown, max = 100000): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) return fail();
  return value;
}
function array(value: unknown, max = 10000): unknown[] {
  if (!Array.isArray(value) || value.length > max) return fail();
  return value;
}
const roles = ['pv', 'ow', 'wd', 'wg', 'ng', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijv_bep', 'bijzin', 'vw_neven', 'vw_onder', 'nwd', 'wwd'];
// Existing trainer reports count main-role mistakes by display label.
const errorKeys = [...roles, 'Verdeling', 'Persoonsvorm', 'Onderwerp', 'Lijdend Voorwerp', 'Meewerkend Voorwerp', 'Bijwoordelijke Bepaling', 'Voorzetselvoorwerp', 'Bijstelling', 'Werkwoordelijk Gezegde', 'Werkwoordelijk Deel', 'Naamwoordelijk Gezegde', 'Naamwoordelijk Deel', 'Bijzin', 'Nevenschikkend VW', 'Bijvoeglijke Bepaling', 'Onderschikkend VW'];
function role(value: unknown): string {
  if (typeof value !== 'string' || !roles.includes(value)) return fail();
  return value;
}
/** Bounded telemetry and token identifiers: no identity fields or encoded blobs. */
export function report(value: unknown) {
  const r = object(value, ['v', 'ts', 'c', 't', 'lvl', 'err', 'sids', 'res', 'hint', 'dur', 'sols', 'src']);
  if (r.v !== 1 || typeof r.ts !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(r.ts) || !Number.isFinite(Date.parse(r.ts))) return fail();
  integer(r.c); integer(r.t);
  if ((r.c as number) > (r.t as number)) return fail();
  if (r.lvl !== null) integer(r.lvl, 4);
  object(r.err, errorKeys);
  Object.values(r.err as Record<string, unknown>).forEach(v => integer(v, 10000));
  const ids = array(r.sids);
  if (!ids.length) return fail();
  ids.forEach(v => integer(v, 1000000000));
  if (r.res !== undefined) array(r.res).forEach(value => {
    const row = object(value, ['sid', 'ok']);
    integer(row.sid, 1000000000);
    if (!ids.includes(row.sid) || typeof row.ok !== 'boolean') fail();
  });
  if (r.hint !== undefined) integer(r.hint, 10000);
  if (r.dur !== undefined) integer(r.dur, 86400);
  if (r.src !== undefined && !['pool', 'json', 'selected', 'shared'].includes(r.src as string)) return fail();
  if (r.sols !== undefined) array(r.sols).forEach(value => {
    const row = object(value, ['sid', 'sp', 'lb']);
    integer(row.sid, 1000000000);
    if (!ids.includes(row.sid)) fail();
    array(row.sp, 300).forEach(v => integer(v, 300));
    if (!row.lb || typeof row.lb !== 'object' || Array.isArray(row.lb)) fail();
    const labels = Object.entries(row.lb as Record<string, unknown>);
    if (labels.length > 300) fail();
    labels.forEach(([key, value]) => {
      // Imported sentences have their own token IDs; keep the existing contract.
      text(key, 128);
      if (['__proto__', 'prototype', 'constructor'].includes(key)) fail();
      role(value);
    });
  });
  return r;
}
export async function jsonBody(request: Request, maxBytes = 32768): Promise<unknown> {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, 'JSON vereist.');
  const length = request.headers.get('Content-Length');
  if (length && Number(length) > maxBytes) throw new ApiError(413, 'Verzoek te groot.');
  if (!request.body) return fail();
  const reader = request.body.getReader();
  let timeout: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new ApiError(408, 'Verzoek verlopen.'));
      void reader.cancel().catch(() => {});
    }, 10000);
  });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError(413, 'Verzoek te groot.'); }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timeout!);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)); }
  catch { return fail(); }
}
