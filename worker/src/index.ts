import type { JWTVerifyGetKey } from 'jose';
import { ApiError, type Env } from './types';
import { jsonBody, object, text, studentId, report } from './validation';
import { account, authorize, challenge, login, googleKeys, learner, hash, token, cookie, cookieValue, SESSION_COOKIE, STUDENT_COOKIE, seconds, now, type Account } from './auth';

const teacherRoles = ['teacher', 'owner'] as const;
// Bound JSON parsing/base64 work per request on Workers Free. Clients follow cursors.
const REPORT_PAGE_SIZE = 20;
function config(env: Env, request: Request) {
  const app = new URL(env.APP_ORIGIN);
  const url = new URL(request.url);
  const local = env.ALLOW_LOCAL_HTTP === 'true' && ['localhost', '127.0.0.1'].includes(app.hostname) && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (app.origin !== env.APP_ORIGIN || app.pathname !== '/' || (!local && (app.protocol !== 'https:' || url.protocol !== 'https:'))) throw new ApiError(503, 'Dienst niet beschikbaar.');
  if (!local && url.origin !== app.origin) throw new ApiError(403, 'Geen toegang.');
}
function secure(response: Response, env: Env, api: boolean): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; img-src 'self' data:; font-src 'self'; connect-src 'self' https://accounts.google.com/gsi/; frame-src https://accounts.google.com/gsi/; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'");
  if (env.APP_ORIGIN?.startsWith('https:')) headers.set('Strict-Transport-Security', 'max-age=31536000');
  if (api) { headers.set('Cache-Control', 'no-store'); headers.set('Vary', 'Origin'); }
  return new Response(response.body, { status: response.status, headers });
}
async function rateLimit(request: Request, env: Env, kind: 'report' | 'auth', student?: string) {
  const limiter = kind === 'report' ? env.REPORT_LIMITER : env.AUTH_LIMITER;
  if (!limiter) throw new ApiError(503, 'Dienst niet beschikbaar.');
  // CF-Connecting-IP is set by Cloudflare, never use caller-provided X-Forwarded-For.
  const key = student ?? request.headers.get('CF-Connecting-IP') ?? 'local';
  if (!(await limiter.limit({ key })).success) throw new ApiError(429, 'Te veel verzoeken. Probeer later opnieuw.');
}
async function dailyBudget(env: Env) {
  const day = Math.floor(now() / 86400);
  const budget = seconds(env.REPORTS_PER_DAY, 10000, 100000);
  const row = await env.DB.prepare('INSERT INTO rate_budgets(bucket, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count = count + 1 RETURNING count').bind('reports:' + day, (day + 2) * 86400).first<{ count: number }>();
  if (!row || row.count > budget) throw new ApiError(429, 'Daglimiet bereikt. Probeer later opnieuw.');
}
async function teacher(request: Request, env: Env): Promise<Account> {
  const user = await account(request, env);
  authorize(user, [...teacherRoles]);
  return user;
}
async function ownedStudent(env: Env, user: Account, id: string) {
  const row = await env.DB.prepare('SELECT id, teacher_subject FROM students WHERE id = ?').bind(id).first<{ id: string; teacher_subject: string }>();
  if (!row || (user.role !== 'owner' && row.teacher_subject !== user.subject)) throw new ApiError(403, 'Geen toegang.');
}
async function enrollmentCode(env: Env, id: string): Promise<string> {
  const code = token();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM enrollment_codes WHERE student_id = ?').bind(id),
    env.DB.prepare('DELETE FROM student_sessions WHERE student_id = ?').bind(id),
    env.DB.prepare('INSERT INTO enrollment_codes(code_hash, student_id, expires_at) VALUES (?, ?, ?)').bind(await hash(code), id, now() + 86400),
  ]);
  return code;
}
function reportCode(data: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  return 'v1:' + btoa(String.fromCharCode(...bytes));
}
async function rows(env: Env, user: Account | string, input: unknown) {
  const data = object(input, ['cursor']);
  const cursor = data.cursor === undefined ? '' : text(data.cursor, 100);
  if (cursor && !/^\d{4}-\d\d-\d\dT[\d:.]+Z\|[\w-]{36}$/.test(cursor)) throw new ApiError(400, 'Ongeldige invoer.');
  const [timestamp, id] = cursor.split('|');
  const condition = typeof user === 'string' ? 's.id = ?' : '(s.teacher_subject = ? OR ? = 1)';
  const params: (string | number)[] = typeof user === 'string' ? [user] : [user.subject, user.role === 'owner' ? 1 : 0];
  const results = await env.DB.prepare(`SELECT r.id, r.student_id, r.received_at, r.report_json, s.name, s.initial, s.class_label FROM reports r JOIN students s ON s.id = r.student_id WHERE ${condition} AND (r.received_at > ? OR (r.received_at = ? AND r.id > ?)) ORDER BY r.received_at, r.id LIMIT ${REPORT_PAGE_SIZE + 1}`).bind(...params, timestamp ?? '', timestamp ?? '', id ?? '').all<{ id: string; student_id: string; received_at: string; report_json: string; name: string; initial: string; class_label: string }>();
  const page = results.results.slice(0, REPORT_PAGE_SIZE);
  const last = page.at(-1);
  return Response.json({ rows: page.map(row => ({ id: row.id, studentId: row.student_id, ts: row.received_at, naam: row.name, initiaal: row.initial, klas: row.class_label,
    code: reportCode({ ...JSON.parse(row.report_json), name: row.name, initiaal: row.initial, klas: row.class_label }) })), nextCursor: results.results.length > REPORT_PAGE_SIZE && last ? last.received_at + '|' + last.id : null });
}

export function createApi(keys: JWTVerifyGetKey = googleKeys) {
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
      const isApi = url.pathname === '/api' || url.pathname.startsWith('/api/');
      try {
        config(env, request);
        if (!isApi) return secure(await env.ASSETS.fetch(request), env, false);
        // No API query strings: paging, pupil info and credentials belong in JSON bodies.
        if (url.search) throw new ApiError(400, 'Queryparameters niet toegestaan.');
        const origin = request.headers.get('Origin');
        if (origin && origin !== env.APP_ORIGIN) throw new ApiError(403, 'Geen toegang.');
        if (request.method === 'OPTIONS') {
          if (origin !== env.APP_ORIGIN || !['GET', 'POST'].includes(request.headers.get('Access-Control-Request-Method') ?? '')) throw new ApiError(403, 'Geen toegang.');
          return secure(new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': env.APP_ORIGIN, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' } }), env, true);
        }
        if (!['GET', 'POST'].includes(request.method)) throw new ApiError(405, 'Methode niet toegestaan.');
        // Origin + JSON-only + SameSite=Strict prevents CSRF including sibling subdomains.
        if (request.method === 'POST' && origin !== env.APP_ORIGIN) throw new ApiError(403, 'Geen toegang.');
        let response: Response;
        const path = url.pathname.slice(4);
        if (path === '/auth/challenge' && request.method === 'POST') {
          await rateLimit(request, env, 'auth'); object(await jsonBody(request), []);
          response = await challenge(env);
        } else if (path === '/auth/login' && request.method === 'POST') {
          await rateLimit(request, env, 'auth'); response = await login(request, env, await jsonBody(request), keys);
        } else if (path === '/auth/session' && request.method === 'GET') {
          const user = await account(request, env); response = Response.json({ role: user.role, email: user.email });
        } else if (path === '/auth/logout' && request.method === 'POST') {
          object(await jsonBody(request), []);
          const raw = cookieValue(request, SESSION_COOKIE);
          await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(raw)).run();
          response = Response.json({ ok: true }, { headers: { 'Set-Cookie': cookie(SESSION_COOKIE, '', 0) } });
        } else if (path === '/student/enroll' && request.method === 'POST') {
          await rateLimit(request, env, 'auth');
          const data = object(await jsonBody(request), ['code']);
          const code = text(data.code, 43);
          if (!/^[\w-]{43}$/.test(code)) throw new ApiError(400, 'Ongeldige invoer.');
          const raw = token(), lifetime = 30 * 86400;
          const codeHash = await hash(code), currentTime = now();
          // D1 batch is transactional: consuming a code and granting its session
          // must not straddle a concurrent teacher revocation/reissue.
          const [created] = await env.DB.batch([
            env.DB.prepare('INSERT INTO student_sessions(token_hash, student_id, expires_at) SELECT ?, student_id, ? FROM enrollment_codes WHERE code_hash = ? AND expires_at > ?').bind(await hash(raw), currentTime + lifetime, codeHash, currentTime),
            env.DB.prepare('DELETE FROM enrollment_codes WHERE code_hash = ? AND expires_at > ?').bind(codeHash, currentTime),
          ]);
          if (created.meta.changes !== 1) throw new ApiError(401, 'Ongeldige of verlopen leerlingcode.');
          response = Response.json({ ok: true }, { headers: { 'Set-Cookie': cookie(STUDENT_COOKIE, raw, lifetime) } });
        } else if (path === '/student/session' && request.method === 'GET') {
          const id = await learner(request, env);
          response = Response.json(await env.DB.prepare('SELECT id, name, initial, class_label AS klas FROM students WHERE id = ?').bind(id).first());
        } else if (path === '/student/logout' && request.method === 'POST') {
          object(await jsonBody(request), []);
          await env.DB.prepare('DELETE FROM student_sessions WHERE token_hash = ?').bind(await hash(cookieValue(request, STUDENT_COOKIE))).run();
          response = Response.json({ ok: true }, { headers: { 'Set-Cookie': cookie(STUDENT_COOKIE, '', 0) } });
        } else if (path === '/student/reports' && request.method === 'POST') {
          const id = await learner(request, env); response = await rows(env, id!, await jsonBody(request));
        } else if (path === '/reports' && request.method === 'POST') {
          const id = await learner(request, env);
          await rateLimit(request, env, 'report', id!);
          const data = object(await jsonBody(request), ['report']); const result = report(data.report);
          await dailyBudget(env);
          await env.DB.prepare('INSERT INTO reports(id, student_id, received_at, report_json) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), id, new Date().toISOString(), JSON.stringify(result)).run();
          response = Response.json({ ok: true }, { status: 201 });
        } else if (path.startsWith('/teacher/')) {
          const user = await teacher(request, env);
          if (request.method !== 'POST') throw new ApiError(405, 'Methode niet toegestaan.');
          const input = await jsonBody(request);
          if (path === '/teacher/reports') response = await rows(env, user, input);
          else if (path === '/teacher/students/list') {
            const data = object(input, ['cursor']);
            const cursor = data.cursor === undefined ? '' : studentId(data.cursor);
            const result = await env.DB.prepare('SELECT id, name, initial, class_label AS klas FROM students WHERE (teacher_subject = ? OR ? = 1) AND id > ? ORDER BY id LIMIT 201').bind(user.subject, user.role === 'owner' ? 1 : 0, cursor).all<{ id: string; name: string; initial: string; klas: string }>();
            const students = result.results.slice(0, 200);
            response = Response.json({ students, nextCursor: result.results.length > 200 ? students.at(-1)!.id : null });
          } else if (path === '/teacher/students') {
            const data = object(input, ['name', 'initial', 'klas']);
            const name = text(data.name, 80), klas = text(data.klas, 32).toLowerCase();
            const initial = data.initial === '' || data.initial === undefined ? '' : text(data.initial, 1).toUpperCase();
            const id = crypto.randomUUID();
            await env.DB.prepare('INSERT INTO students(id, teacher_subject, name, initial, class_label, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, user.subject, name, initial, klas, new Date().toISOString()).run();
            response = Response.json({ studentId: id, code: await enrollmentCode(env, id) }, { status: 201 });
          } else if (path === '/teacher/students/code') {
            const data = object(input, ['studentId']); const id = studentId(data.studentId);
            await ownedStudent(env, user, id); response = Response.json({ code: await enrollmentCode(env, id) });
          } else if (path === '/teacher/students/update') {
            const data = object(input, ['studentId', 'name', 'initial', 'klas']); const id = studentId(data.studentId);
            await ownedStudent(env, user, id);
            const name = text(data.name, 80), klas = text(data.klas, 32).toLowerCase();
            const initial = data.initial === '' ? '' : text(data.initial, 1).toUpperCase();
            await env.DB.prepare('UPDATE students SET name = ?, initial = ?, class_label = ? WHERE id = ?').bind(name, initial, klas, id).run(); response = Response.json({ ok: true });
          } else if (path === '/teacher/classes/rename') {
            const data = object(input, ['oldKlas', 'newKlas']);
            const oldKlas = text(data.oldKlas, 32).toLowerCase(), newKlas = text(data.newKlas, 32).toLowerCase();
            const result = await env.DB.prepare('UPDATE students SET class_label = ? WHERE class_label = ? AND (teacher_subject = ? OR ? = 1)').bind(newKlas, oldKlas, user.subject, user.role === 'owner' ? 1 : 0).run(); response = Response.json({ updated: result.meta.changes });
          } else throw new ApiError(404, 'Niet gevonden.');
        } else if (path === '/owner/status' || path === '/owner/sessions/revoke') {
          const user = await account(request, env); authorize(user, ['owner']);
          if (path === '/owner/status' && request.method === 'GET') response = Response.json({ ok: true, storage: 'D1' });
          else if (path === '/owner/sessions/revoke' && request.method === 'POST') {
            object(await jsonBody(request), []);
            await env.DB.prepare('DELETE FROM sessions WHERE token_hash != ?').bind(await hash(cookieValue(request, SESSION_COOKIE))).run();
            response = Response.json({ ok: true });
          } else throw new ApiError(405, 'Methode niet toegestaan.');
        } else throw new ApiError(404, 'Niet gevonden.');
        return secure(response, env, true);
      } catch (error) {
        // Never log the request, credentials, upstream response or exception.
        const known = error instanceof ApiError;
        return secure(Response.json({ error: known ? error.message : 'Dienst niet beschikbaar.' }, { status: known ? error.status : 503, headers: error instanceof ApiError && error.status === 429 ? { 'Retry-After': '60' } : {} }), env, true);
      }
    },
    async scheduled(_event: ScheduledController, env: Env): Promise<void> {
      await env.DB.batch(['sessions', 'student_sessions', 'login_challenges', 'enrollment_codes', 'rate_budgets'].map(table => env.DB.prepare(`DELETE FROM ${table} WHERE expires_at <= ?`).bind(now())));
    },
  };
}
export default createApi();
