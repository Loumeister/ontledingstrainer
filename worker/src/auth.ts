import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTVerifyGetKey, JWTPayload } from 'jose';
import { ApiError, type Env, type Role } from './types';
import { object, text } from './validation';

export const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), { timeoutDuration: 5000 });
export const SESSION_COOKIE = '__Host-ontleedlab';
export const STUDENT_COOKIE = '__Host-ontleedlab-student';
const CHALLENGE_COOKIE = '__Host-ontleedlab-challenge';
export const now = () => Math.floor(Date.now() / 1000);
export function token(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
export async function hash(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export function cookieValue(request: Request, name: string): string {
  return request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1) ?? '';
}
export function cookie(name: string, value: string, seconds: number): string {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
}
export function seconds(value: string | undefined, fallback: number, max: number): number {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) throw new ApiError(503, 'Dienst niet beschikbaar.');
  return n;
}
function includes(list: string | undefined, email: string): boolean {
  return !!list?.split(',').map(v => v.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
export function accountRole(env: Env, email: string): Role | null {
  if (includes(env.OWNER_EMAILS, email)) return 'owner';
  if (includes(env.TEACHER_EMAILS, email)) return 'teacher';
  if (includes(env.EDITOR_EMAILS, email)) return 'editor';
  if (includes(env.STUDENT_EMAILS, email)) return 'student';
  return null;
}
export interface Account { subject: string; email: string; role: Role }
export async function account(request: Request, env: Env): Promise<Account> {
  const raw = cookieValue(request, SESSION_COOKIE);
  if (!/^[\w-]{43}$/.test(raw)) {
    // An enrolled learner is authenticated, but never a teacher.
    if (await learner(request, env, false)) throw new ApiError(403, 'Geen toegang.');
    throw new ApiError(401, 'Aanmelden vereist.');
  }
  const row = await env.DB.prepare('SELECT subject, email FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(await hash(raw), now()).first<{ subject: string; email: string }>();
  if (!row) throw new ApiError(401, 'Aanmelden vereist.');
  const role = accountRole(env, row.email);
  if (!role) throw new ApiError(403, 'Geen toegang.');
  return { ...row, role };
}
export function authorize(user: Account, roles: Role[]): void {
  if (!roles.includes(user.role)) throw new ApiError(403, 'Geen toegang.');
}
export async function learner(request: Request, env: Env, required = true): Promise<string | null> {
  const raw = cookieValue(request, STUDENT_COOKIE);
  const row = /^[\w-]{43}$/.test(raw) ? await env.DB.prepare('SELECT student_id FROM student_sessions WHERE token_hash = ? AND expires_at > ?').bind(await hash(raw), now()).first<{ student_id: string }>() : null;
  if (!row && required) throw new ApiError(401, 'Leerlingaanmelding vereist.');
  return row?.student_id ?? null;
}
export async function challenge(env: Env): Promise<Response> {
  if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.startsWith('CONFIGURE')) throw new ApiError(503, 'Aanmelden is nog niet ingesteld.');
  const raw = token(), nonce = token();
  await env.DB.prepare('INSERT INTO login_challenges(token_hash, nonce, expires_at) VALUES (?, ?, ?)').bind(await hash(raw), nonce, now() + 300).run();
  return Response.json({ clientId: env.GOOGLE_CLIENT_ID, nonce }, { headers: { 'Set-Cookie': cookie(CHALLENGE_COOKIE, raw, 300) } });
}
export async function login(request: Request, env: Env, input: unknown, keys: JWTVerifyGetKey): Promise<Response> {
  const data = object(input, ['credential']);
  const credential = text(data.credential, 12000);
  const raw = cookieValue(request, CHALLENGE_COOKIE);
  if (!/^[\w-]{43}$/.test(raw)) throw new ApiError(401, 'Ongeldige aanmelding.');
  // Atomic consumption prevents concurrent replay and cookie fixation.
  const pending = await env.DB.prepare('DELETE FROM login_challenges WHERE token_hash = ? AND expires_at > ? RETURNING nonce').bind(await hash(raw), now()).first<{ nonce: string }>();
  if (!pending) throw new ApiError(401, 'Ongeldige aanmelding.');
  let claims: JWTPayload;
  try {
    const verified = await jwtVerify(credential, keys, {
      algorithms: ['RS256'], audience: env.GOOGLE_CLIENT_ID,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      requiredClaims: ['sub', 'exp', 'iat', 'email', 'email_verified', 'nonce'], maxTokenAge: '10m',
    });
    claims = verified.payload;
  } catch { throw new ApiError(401, 'Ongeldige aanmelding.'); }
  if (claims.nonce !== pending.nonce || claims.email_verified !== true || typeof claims.email !== 'string' || typeof claims.sub !== 'string') throw new ApiError(401, 'Ongeldige aanmelding.');
  // Google must be authoritative for the email used by the allowlist.
  if (!claims.email.endsWith('@gmail.com') && (typeof claims.hd !== 'string' || claims.email.split('@')[1] !== claims.hd)) throw new ApiError(403, 'Geen toegang.');
  const role = accountRole(env, claims.email);
  if (!role) throw new ApiError(403, 'Geen toegang.');
  const rawSession = token();
  const lifetime = seconds(env.SESSION_SECONDS, 3600, 28800);
  const statements = [env.DB.prepare('INSERT INTO sessions(token_hash, subject, email, expires_at) VALUES (?, ?, ?, ?)').bind(await hash(rawSession), claims.sub, claims.email, now() + lifetime)];
  const old = cookieValue(request, SESSION_COOKIE);
  if (old) statements.push(env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(old)));
  await env.DB.batch(statements);
  const headers = new Headers();
  headers.append('Set-Cookie', cookie(SESSION_COOKIE, rawSession, lifetime));
  headers.append('Set-Cookie', cookie(CHALLENGE_COOKIE, '', 0));
  return Response.json({ role, email: claims.email }, { headers });
}
