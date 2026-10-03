import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFileSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { createApi } from './index';
import type { Env } from './types';

const origin = 'https://school.example';
let runtime: Miniflare;
let env: Env;
let api: ReturnType<typeof createApi>;
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let limited = false;
const report = { v: 1, ts: '2026-09-30T09:00:00.000Z', c: 3, t: 4, lvl: 1, err: { ow: 1 }, sids: [1], res: [{ sid: 1, ok: false }] };
const call = (path: string, method = 'GET', body?: unknown, cookie = '', headers: Record<string, string> = {}) => api.fetch(new Request(origin + '/api' + path, {
  method, headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
}), env);
const cookieFrom = (response: Response) => response.headers.get('Set-Cookie')!.split(';')[0];

async function login(email = 'teacher@gmail.com', subject = 'teacher-1') {
  const challenge = await call('/auth/challenge', 'POST', {});
  const { nonce } = await challenge.json() as { nonce: string };
  const credential = await new SignJWT({ email, email_verified: true, nonce })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuer('https://accounts.google.com')
    .setAudience('test-client').setSubject(subject).setIssuedAt().setExpirationTime('1h').sign(keys.privateKey);
  const response = await call('/auth/login', 'POST', { credential }, cookieFrom(challenge));
  expect(response.status).toBe(200);
  return cookieFrom(response);
}
async function enroll(teacher: string) {
  const created = await call('/teacher/students', 'POST', { name: 'Emma', initial: 'V', klas: '2a' }, teacher);
  expect(created.status).toBe(201);
  const { code, studentId } = await created.json() as { code: string; studentId: string };
  const enrolled = await call('/student/enroll', 'POST', { code });
  expect(enrolled.status).toBe(200);
  return { cookie: cookieFrom(enrolled), code, studentId };
}

beforeAll(async () => {
  runtime = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response("ok") } }', compatibilityDate: '2026-08-01', d1Databases: ['DB'] }));
  const db = await runtime.getD1Database('DB');
  const sql = readFileSync(new URL('../migrations/0001_security.sql', import.meta.url), 'utf8') + readFileSync(new URL('../migrations/0002_free_tier_indexes.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').filter(s => s.trim())) await db.prepare(statement).run();
  keys = await generateKeyPair('RS256', { extractable: true });
  const jwk = await exportJWK(keys.publicKey);
  api = createApi(createLocalJWKSet({ keys: [{ ...jwk, alg: 'RS256', kid: 'test' }] }));
  env = {
    DB: db as unknown as Env['DB'], APP_ORIGIN: origin, GOOGLE_CLIENT_ID: 'test-client',
    TEACHER_EMAILS: 'teacher@gmail.com,other@gmail.com', OWNER_EMAILS: 'owner@gmail.com',
    STUDENT_EMAILS: 'student@gmail.com', EDITOR_EMAILS: 'editor@gmail.com',
    REPORT_LIMITER: { limit: async () => ({ success: !limited }) },
    AUTH_LIMITER: { limit: async () => ({ success: !limited }) },
    ASSETS: { fetch: async () => new Response('<html>assets</html>') } as unknown as Env['ASSETS'],
  };
});
afterAll(async () => { await runtime?.dispose(); });
beforeEach(async () => {
  limited = false;
  for (const table of ['reports', 'student_sessions', 'enrollment_codes', 'students', 'sessions', 'login_challenges', 'rate_budgets']) await env.DB.prepare(`DELETE FROM ${table}`).run();
});

describe('server trust boundary', () => {
  it('offers code enrollment without exposing fixed-password endpoints in the Free deployment', async () => {
    const teacher = await login();
    const student = await enroll(teacher);
    const input = { username: 'synthetic-login', password: 'synthetic-password' };
    const fixedLogin = await call('/student/login', 'POST', input);
    expect(fixedLogin.status).toBe(404);
    expect(fixedLogin.headers.has('Set-Cookie')).toBe(false);
    expect((await call('/student/password', 'POST', input, student.cookie)).status).toBe(404);
    expect((await call('/teacher/students/credentials', 'POST', { studentId: student.studentId, username: input.username }, teacher)).status).toBe(404);
    expect(await (await call('/student/session', 'GET', undefined, student.cookie)).json()).toEqual({ id: student.studentId, name: 'Emma', initial: 'V', klas: '2a' });
  });
  it('paginates the private register without truncating long-lived classes', async () => {
    const teacher = await login();
    const ids = Array.from({ length: 202 }, () => crypto.randomUUID());
    await env.DB.batch(ids.map(id => env.DB.prepare('INSERT INTO students(id, teacher_subject, name, initial, class_label, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, 'teacher-1', 'Emma', '', '2a', report.ts)));
    const page1 = await (await call('/teacher/students/list', 'POST', {}, teacher)).json() as { students: { id: string }[]; nextCursor: string };
    expect(page1.students).toHaveLength(200);
    const page2 = await (await call('/teacher/students/list', 'POST', { cursor: page1.nextCursor }, teacher)).json() as { students: { id: string }[]; nextCursor: null };
    expect(page2.students).toHaveLength(2); expect(page2.nextCursor).toBeNull();
    expect(new Set([...page1.students, ...page2.students].map(student => student.id)).size).toBe(202);
    const other = await login('other@gmail.com', 'teacher-2');
    expect(await (await call('/teacher/students/list', 'POST', {}, other)).json()).toEqual({ students: [], nextCursor: null });
  });
  it('denies anonymous reads and storage flags or forged cookies', async () => {
    expect((await call('/teacher/reports')).status).toBe(401);
    expect((await call('/teacher/reports', 'GET', undefined, '__Host-ontleedlab=usage-pin-ok=true')).status).toBe(401);
  });

  it('allows a teacher to trace their enrolled learner and denies other teachers', async () => {
    const teacher = await login();
    const learner = await enroll(teacher);
    const sent = await call('/reports', 'POST', { report }, learner.cookie);
    expect(sent.status).toBe(201);
    expect(await sent.json()).toEqual({ ok: true });
    const rows = await (await call('/teacher/reports', 'POST', {}, teacher)).json() as { rows: Array<{ naam: string; klas: string; studentId: string; code: string }> };
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({ naam: 'Emma', klas: '2a', studentId: learner.studentId });
    const other = await login('other@gmail.com', 'teacher-2');
    expect(await (await call('/teacher/reports', 'POST', {}, other)).json()).toEqual({ rows: [], nextCursor: null });
    expect((await call('/teacher/students/code', 'POST', { studentId: learner.studentId }, other)).status).toBe(403);
    expect((await call('/teacher/reports', 'POST', {}, learner.cookie)).status).toBe(403);
  });

  it('rejects student and editor accounts from staff APIs and teacher from owner APIs', async () => {
    const student = await login('student@gmail.com', 'student-1');
    const editor = await login('editor@gmail.com', 'editor-1');
    const teacher = await login();
    expect((await call('/teacher/reports', 'POST', {}, student)).status).toBe(403);
    expect((await call('/teacher/students', 'POST', {}, editor)).status).toBe(403);
    expect((await call('/owner/status', 'GET', undefined, teacher)).status).toBe(403);
    expect((await call('/owner/sessions/revoke', 'POST', {}, teacher)).status).toBe(403);
    const owner = await login('owner@gmail.com', 'owner-1');
    expect((await call('/owner/status', 'GET', undefined, owner)).status).toBe(200);
    expect((await call('/owner/sessions/revoke', 'POST', {}, owner)).status).toBe(200);
    expect((await call('/auth/session', 'GET', undefined, teacher)).status).toBe(401);
  });

  it('uses one-time codes and preserves identity and reports on device replacement', async () => {
    const teacher = await login(); const learner = await enroll(teacher);
    expect((await call('/student/enroll', 'POST', { code: learner.code })).status).toBe(401);
    await call('/reports', 'POST', { report }, learner.cookie);
    const issued = await call('/teacher/students/code', 'POST', { studentId: learner.studentId }, teacher);
    expect((await call('/reports', 'POST', { report }, learner.cookie)).status).toBe(401);
    const fresh = await call('/student/enroll', 'POST', await issued.json());
    expect(fresh.status).toBe(200);
    const identity = await (await call('/student/session', 'GET', undefined, cookieFrom(fresh))).json();
    expect(identity).toMatchObject({ id: learner.studentId, name: 'Emma' });
    const own = await (await call('/student/reports', 'POST', {}, cookieFrom(fresh))).json() as { rows: unknown[] };
    expect(own.rows).toHaveLength(1);
  });

  it('rejects client-selected student IDs, PII and unknown telemetry fields', async () => {
    const learner = await enroll(await login());
    for (const input of [{ report, studentId: learner.studentId }, { report: { ...report, name: 'Emma' } }, { report: { ...report, klas: '2a' } }, {}, { report: { ...report, c: -1 } }, { report: { ...report, err: { secret: 1 } } }, { report: { ...report, sols: [{ sid: 1, sp: [0], lb: { 's1t1': 'arbitrary text' } }] } }]) {
      expect((await call('/reports', 'POST', input, learner.cookie)).status).toBe(400);
    }
    expect((await call('/reports', 'POST', { report })).status).toBe(401);
  });
  it('accepts existing trainer error labels and detailed learner solutions', async () => {
    const learner = await enroll(await login());
    const actualReport = { ...report, err: { Verdeling: 1, Onderwerp: 1 }, sols: [{ sid: 1, sp: [1, 2], lb: { s1t1: 'ow', s1t3: 'pv' } }], dur: 120, hint: 1, src: 'pool' };
    expect((await call('/reports', 'POST', { report: actualReport }, learner.cookie)).status).toBe(201);
  });

  it('accepts long sessions and imported token identifiers within the byte limit', async () => {
    const learner = await enroll(await login());
    const sids = Array.from({ length: 101 }, (_, index) => index + 1);
    const payload = { ...report, sids, res: sids.map(sid => ({ sid, ok: true })),
      sols: [{ sid: 1, sp: [1], lb: { word1: 'ow', 'custom-token': 'pv' } }], src: 'json' };
    expect((await call('/reports', 'POST', { report: payload }, learner.cookie)).status).toBe(201);
  });

  it('cannot resurrect an old-code session after a concurrent code reissue', async () => {
    const teacher = await login();
    const created = await call('/teacher/students', 'POST', { name: 'Emma', initial: '', klas: '2a' }, teacher);
    const { code, studentId } = await created.json() as { code: string; studentId: string };
    const db = env.DB;
    let rotated = false;
    let freshCode: unknown;
    // Schedule reissue just before the session-write operation reaches real D1.
    const rotate = async () => {
      if (rotated) return;
      rotated = true;
      freshCode = await (await call('/teacher/students/code', 'POST', { studentId }, teacher)).json();
    };
    const interleaved = new Proxy(db, { get(target, property) {
      if (property === 'batch') return async (statements: D1PreparedStatement[]) => {
        await rotate(); return target.batch(statements);
      };
      if (property === 'prepare') return (sql: string) => {
        const statement = target.prepare(sql);
        if (!sql.startsWith('INSERT INTO student_sessions') || sql.includes('SELECT')) return statement;
        return { bind: (...values: unknown[]) => {
          const bound = statement.bind(...values);
          return { run: async () => { await rotate(); return bound.run(); } };
        } };
      };
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    const pending = await api.fetch(new Request(origin + '/api/student/enroll', {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
    }), { ...env, DB: interleaved });
    expect(rotated).toBe(true);
    expect(pending.status).toBe(401);
    expect((await db.prepare('SELECT COUNT(*) AS count FROM student_sessions').first<{ count: number }>())?.count).toBe(0);
    expect((await call('/student/enroll', 'POST', freshCode)).status).toBe(200);
  });

  it('rejects oversized, malformed and non-JSON input without leaking bodies', async () => {
    const learner = await enroll(await login());
    expect((await call('/reports', 'POST', { report, padding: 'x'.repeat(33000) }, learner.cookie)).status).toBe(413);
    expect((await call('/reports', 'POST', { report }, learner.cookie, { 'Content-Type': 'text/plain' })).status).toBe(415);
    const malformed = new Request(origin + '/api/reports', { method: 'POST', headers: { Origin: origin, Cookie: learner.cookie, 'Content-Type': 'application/json' }, body: '{' });
    expect((await api.fetch(malformed, env)).status).toBe(400);
  });

  it('enforces rate limiting and an atomic daily global budget', async () => {
    const learner = await enroll(await login());
    limited = true;
    const denied = await call('/reports', 'POST', { report }, learner.cookie);
    expect(denied.status).toBe(429); expect(denied.headers.get('Retry-After')).toBe('60');
    limited = false;
    const original = env.REPORTS_PER_DAY; env.REPORTS_PER_DAY = '1';
    try {
      const responses = await Promise.all([call('/reports', 'POST', { report }, learner.cookie), call('/reports', 'POST', { report }, learner.cookie)]);
      expect(responses.map(r => r.status).sort()).toEqual([201, 429]);
    } finally { env.REPORTS_PER_DAY = original; }
  });

  it('enforces same-origin CSRF protection, strict CORS, HTTPS and no API querystrings', async () => {
    const teacher = await login();
    expect((await call('/teacher/students', 'POST', {}, teacher, { Origin: 'https://evil.example' })).status).toBe(403);
    expect((await call('/teacher/students', 'POST', {}, teacher, { Origin: '' })).status).toBe(403);
    expect((await call('/reports?naam=Emma')).status).toBe(400);
    const preflight = await call('/teacher/reports', 'OPTIONS', undefined, '', { 'Access-Control-Request-Method': 'POST' });
    expect(preflight.status).toBe(204); expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    const evil = await call('/teacher/reports', 'OPTIONS', undefined, '', { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' });
    expect(evil.status).toBe(403); expect(evil.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect((await api.fetch(new Request('http://school.example/api/auth/session'), env)).status).toBe(503);
    expect((await call('/reports', 'GET', undefined, teacher)).status).not.toBe(200);
    expect((await call('/teacher/classes/rename', 'GET', undefined, teacher)).status).toBe(405);
  });

  it('uses secure cookies, expires sessions, revokes logout and re-evaluates roles server-side', async () => {
    const challenge = await call('/auth/challenge', 'POST', {});
    expect(challenge.headers.get('Set-Cookie')).toMatch(/HttpOnly; Secure; SameSite=Strict/);
    const teacher = await login();
    const old = env.TEACHER_EMAILS; env.TEACHER_EMAILS = '';
    expect((await call('/teacher/reports', 'POST', {}, teacher)).status).toBe(403);
    env.TEACHER_EMAILS = old;
    expect((await call('/auth/logout', 'POST', {}, teacher)).status).toBe(200);
    expect((await call('/teacher/reports', 'POST', {}, teacher)).status).toBe(401);
    const fresh = await login();
    await env.DB.prepare('UPDATE sessions SET expires_at = 0').run();
    expect((await call('/teacher/reports', 'POST', {}, fresh)).status).toBe(401);
  });

  it.each(['audience', 'issuer', 'expiry', 'nonce', 'signature', 'unverified', 'non-authoritative', 'not-allowlisted'])('rejects invalid Google identity: %s', async variant => {
    const challenge = await call('/auth/challenge', 'POST', {});
    const { nonce } = await challenge.json() as { nonce: string };
    const forgedKey = variant === 'signature' ? (await generateKeyPair('RS256')).privateKey : keys.privateKey;
    const credential = await new SignJWT({ email: variant === 'not-allowlisted' ? 'unknown@gmail.com' : variant === 'non-authoritative' ? 'teacher@example.org' : 'teacher@gmail.com', email_verified: variant !== 'unverified', nonce: variant === 'nonce' ? 'other' : nonce })
      .setProtectedHeader({ alg: 'RS256', kid: 'test' }).setSubject('teacher-1').setIssuedAt()
      .setAudience(variant === 'audience' ? 'evil-app' : 'test-client')
      .setIssuer(variant === 'issuer' ? 'https://evil.example' : 'https://accounts.google.com')
      .setExpirationTime(variant === 'expiry' ? 1 : '1h').sign(forgedKey);
    expect((await call('/auth/login', 'POST', { credential }, cookieFrom(challenge))).status).toBe(['non-authoritative', 'not-allowlisted'].includes(variant) ? 403 : 401);
    // Even the consumed challenge cannot be replayed after a failed login.
    expect((await call('/auth/login', 'POST', { credential }, cookieFrom(challenge))).status).toBe(401);
  });

  it('isolates learners, class mutations and report pagination', async () => {
    const teacher = await login(); const a = await enroll(teacher); const b = await enroll(teacher);
    await call('/reports', 'POST', { report }, a.cookie);
    expect(await (await call('/student/reports', 'POST', {}, b.cookie)).json()).toEqual({ rows: [], nextCursor: null });
    const other = await login('other@gmail.com', 'teacher-2');
    expect(await (await call('/teacher/classes/rename', 'POST', { oldKlas: '2a', newKlas: '3b' }, other)).json()).toEqual({ updated: 0 });
    expect((await call('/teacher/students/update', 'POST', { studentId: a.studentId, name: 'Other', initial: '', klas: '3b' }, other)).status).toBe(403);
    expect((await call('/teacher/students/update', 'POST', { studentId: a.studentId, name: 'Emma renamed', initial: '', klas: '3b' }, teacher)).status).toBe(200);
    const received = '2026-09-30T10:00:00.000Z';
    await env.DB.batch(Array.from({ length: 201 }, () => env.DB.prepare('INSERT INTO reports(id, student_id, received_at, report_json) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), a.studentId, received, JSON.stringify(report))));
    const first = await (await call('/teacher/reports', 'POST', {}, teacher)).json() as { rows: { id: string }[]; nextCursor: string };
    expect(first.rows).toHaveLength(20);
    const all = [...first.rows];
    let cursor: string | null = first.nextCursor;
    while (cursor) {
      const page = await (await call('/teacher/reports', 'POST', { cursor }, teacher)).json() as { rows: { id: string }[]; nextCursor: string | null };
      expect(page.rows.length).toBeLessThanOrEqual(20);
      expect(page.nextCursor).not.toBe(cursor);
      all.push(...page.rows);
      cursor = page.nextCursor;
    }
    expect(all).toHaveLength(202);
    expect(new Set(all.map(r => r.id)).size).toBe(202);
  });

  it('adds browser headers and returns generic errors on internal failures', async () => {
    const page = await api.fetch(new Request(origin + '/'), env);
    expect(page.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(page.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(page.headers.get('Referrer-Policy')).toBe('no-referrer');
    const broken = { ...env, DB: { prepare: () => { throw new Error('secret-token stack: database credentials'); } } } as unknown as Env;
    const response = await api.fetch(new Request(origin + '/api/auth/session', { headers: { Cookie: '__Host-ontleedlab=' + 'a'.repeat(43) } }), broken);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Dienst niet beschikbaar.' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const missingLimiter = { ...env, AUTH_LIMITER: undefined } as unknown as Env;
    expect((await api.fetch(new Request(origin + '/api/auth/challenge', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}' }), missingLimiter)).status).toBe(503);
  });
});
