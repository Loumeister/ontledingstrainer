import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

// Built production code runs in workerd, without nodejs_compat or any live service.
// Google JWKS and all identities are synthetic; D1 is isolated and disposable.
// Local execution does NOT enforce or measure Cloudflare's production CPU quota.
const origin = 'https://school.example';
const keys = await generateKeyPair('RS256', { extractable: true });
const jwk = { ...await exportJWK(keys.publicKey), alg: 'RS256', kid: 'synthetic' };
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: true,
  scriptPath: fileURLToPath(new URL('../dist/index.js', import.meta.url)),
  compatibilityDate: '2026-08-01',
  d1Databases: ['DB'],
  bindings: { APP_ORIGIN: origin, GOOGLE_CLIENT_ID: 'synthetic-client', TEACHER_EMAILS: 'synthetic-teacher@gmail.com,synthetic-other@gmail.com' },
  outboundService: request => {
    assert.equal(request.url, 'https://www.googleapis.com/oauth2/v3/certs');
    return Response.json({ keys: [jwk] });
  },
  ratelimits: {
    AUTH_LIMITER: { namespace_id: '1002', simple: { limit: 120, period: 60 } },
    REPORT_LIMITER: { namespace_id: '1001', simple: { limit: 10, period: 60 } },
  },
}));
const call = (path, body, cookie = '', headers = {}) => runtime.dispatchFetch(origin + '/api' + path, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, 'CF-Connecting-IP': '192.0.2.1', ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const session = response => response.headers.get('Set-Cookie')?.match(/__Host-ontleedlab(?:-student|-challenge)?=[\w-]+/)?.[0] ?? '';
async function login(email, subject, audience = 'synthetic-client') {
  const challenge = await call('/auth/challenge', {});
  assert.equal(challenge.status, 200);
  const { nonce } = await challenge.json();
  const credential = await new SignJWT({ email, email_verified: true, nonce })
    .setProtectedHeader({ alg: 'RS256', kid: 'synthetic' }).setIssuer('https://accounts.google.com')
    .setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime('1h').sign(keys.privateKey);
  return call('/auth/login', { credential }, session(challenge));
}
try {
  const db = await runtime.getD1Database('DB');
  for (const migration of ['0001_security.sql', '0002_free_tier_indexes.sql']) {
    const sql = readFileSync(new URL('../migrations/' + migration, import.meta.url), 'utf8');
    for (const statement of sql.split(';').filter(value => value.trim())) await db.prepare(statement).run();
  }
  assert.equal((await call('/teacher/reports', {})).status, 401);
  assert.equal((await login('synthetic-teacher@gmail.com', 'teacher', 'wrong-audience')).status, 401);
  const signedIn = await login('synthetic-teacher@gmail.com', 'teacher');
  assert.equal(signedIn.status, 200);
  const teacherCookie = session(signedIn);
  assert.equal((await call('/auth/session', undefined, teacherCookie)).status, 200);
  const created = await call('/teacher/students', { name: 'Testleerling', initial: '', klas: 'test' }, teacherCookie);
  assert.equal(created.status, 201);
  const { studentId, code } = await created.json();
  assert.equal((await call('/student/enroll', { code }, '', { Origin: 'https://other.example' })).status, 403);
  const enrolled = await call('/student/enroll', { code });
  assert.equal(enrolled.status, 200);
  assert.match(enrolled.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Strict; Max-Age=2592000/);
  const studentCookie = session(enrolled);
  assert.equal((await call('/student/enroll', { code })).status, 401);
  assert.equal((await call('/teacher/reports', {}, studentCookie)).status, 403);
  const report = { v: 1, ts: '2026-10-01T09:00:00.000Z', c: 3, t: 4, lvl: 1, err: { ow: 1 }, sids: [1], res: [{ sid: 1, ok: false }] };
  assert.equal((await call('/reports', { report }, studentCookie)).status, 201);
  const otherCookie = session(await login('synthetic-other@gmail.com', 'other'));
  assert.deepEqual(await (await call('/teacher/reports', {}, otherCookie)).json(), { rows: [], nextCursor: null });
  assert.equal((await call('/teacher/students/code', { studentId }, otherCookie)).status, 403);
  const issued = await call('/teacher/students/code', { studentId }, teacherCookie);
  assert.equal(issued.status, 200);
  assert.equal((await call('/student/session', undefined, studentCookie)).status, 401);
  const freshCode = await issued.json();
  const resumed = await call('/student/enroll', freshCode);
  assert.equal(resumed.status, 200);
  const freshCookie = session(resumed);
  assert.deepEqual(await (await call('/student/session', undefined, freshCookie)).json(), { id: studentId, name: 'Testleerling', initial: '', klas: 'test' });
  const history = await (await call('/student/reports', {}, freshCookie)).json();
  assert.equal(history.rows.length, 1);
  assert.equal(history.rows[0].studentId, studentId);
  assert.equal((await call('/student/enroll', freshCode)).status, 401);
  for (const path of ['/student/login', '/student/password', '/teacher/students/credentials']) {
    assert.equal((await call(path, {}, teacherCookie)).status, 404);
  }
  const attempts = [];
  for (let i = 0; i < 11; i++) attempts.push((await call('/reports', { report }, freshCookie)).status);
  assert.ok(attempts.includes(429), 'Native per-student limiter must refuse excess reports');
  assert.equal((await call('/student/logout', {}, freshCookie)).status, 200);
  assert.equal((await call('/student/session', undefined, freshCookie)).status, 401);
  console.log('Native workerd Google verification, OTP, ownership, history, revocation and rate-limit smoke passed. No credentials printed.');
} finally { await runtime.dispose(); }
