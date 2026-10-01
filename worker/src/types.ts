export type Role = 'student' | 'teacher' | 'editor' | 'owner';
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  REPORT_LIMITER: RateLimit;
  AUTH_LIMITER: RateLimit;
  APP_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  OWNER_EMAILS?: string;
  TEACHER_EMAILS?: string;
  EDITOR_EMAILS?: string;
  STUDENT_EMAILS?: string;
  REPORTS_PER_DAY?: string;
  SESSION_SECONDS?: string;
  ALLOW_LOCAL_HTTP?: string;
}
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
