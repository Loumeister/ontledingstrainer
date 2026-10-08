/** Fixed same-origin API. Browser storage and route flags confer no authority. */
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const errors: Record<number, string> = {
  400: 'Ongeldige invoer.', 401: 'Aanmelden vereist. Gebruik je Google-account of eenmalige leerlingcode.',
  403: 'Geen toegang.', 413: 'Rapport te groot.', 429: 'Te veel verzoeken. Probeer later opnieuw.',
};
export async function api<T>(path: string, body?: unknown): Promise<T> {
  // Never accept a caller-controlled host, URL or query string.
  if (!/^\/[a-z/]+$/.test(path)) throw new Error('Ongeldig API-pad.');
  try {
    const response = await fetch('/api' + path, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new ApiError(response.status, errors[response.status] ?? 'Dienst niet beschikbaar.');
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Dienst niet beschikbaar. Controleer je verbinding.');
  }
}
export type AccountRole = 'student' | 'teacher' | 'editor' | 'owner';
export interface AccountSession { role: AccountRole; email: string }
export interface StudentSession { id: string; name: string; initial: string; klas: string }
export const getAccountSession = () => api<AccountSession>('/auth/session');
export const getStudentSession = () => api<StudentSession>('/student/session');
export const enrollStudent = (code: string) => api<{ ok: true }>('/student/enroll', { code });
export async function getStudents(): Promise<StudentSession[]> {
  const students: StudentSession[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const page: { students: StudentSession[]; nextCursor: string | null } = await api('/teacher/students/list', cursor ? { cursor } : {});
    if (!Array.isArray(page.students)) throw new Error('Dienst niet beschikbaar.');
    students.push(...page.students);
    cursor = page.nextCursor;
    if (cursor) {
      if (seen.has(cursor)) throw new Error('Dienst niet beschikbaar.');
      seen.add(cursor);
    }
  } while (cursor);
  return students.sort((a, b) => a.klas.localeCompare(b.klas, 'nl') || a.name.localeCompare(b.name, 'nl') || a.id.localeCompare(b.id));
}
export const createStudent = (name: string, initial: string, klas: string) => api<{ studentId: string; code: string }>('/teacher/students', { name, initial, klas });
export const reissueStudentCode = (studentId: string) => api<{ code: string }>('/teacher/students/code', { studentId });
export const updateStudent = (student: StudentSession) => api<{ ok: true }>('/teacher/students/update', { studentId: student.id, name: student.name, initial: student.initial, klas: student.klas });
