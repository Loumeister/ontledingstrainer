/** Compatibility façade for existing callers; all transport uses the own API. */
import { api, getStudents, updateStudent } from './secureApi';
import { decodeReport, type SessionReport } from './sessionReport';

export interface DriveRow {
  id: string; studentId: string; ts: string; naam: string; initiaal: string; klas: string; code: string;
}
// Kept for existing local merge callers. There is no configurable storage URL.
export function getScriptUrl(): string { return '/api'; }
export function shouldAutoSendReport(_student: { name: string; initiaal: string; klas: string }, url: string): boolean { return url === '/api'; }

/** An explicit allowlist prevents hidden PII in the old encoded report. */
export function publicTelemetry(report: SessionReport) {
  const { v, ts, c, t, lvl, err, sids, res, hint, dur, sols, src } = report;
  return { v, ts, c, t, lvl, err, sids, res, hint, dur, sols, src };
}
export async function postReport(_naam: string, _initiaal: string, _klas: string, code: string): Promise<void> {
  const report = decodeReport(code);
  if (!report) throw new Error('Ongeldige rapportcode.');
  await api('/reports', { report: publicTelemetry(report) });
}
export async function renameKlasOnDrive(oldKlas: string, newKlas: string): Promise<number> {
  const result = await api<{ updated: number }>('/teacher/classes/rename', { oldKlas, newKlas });
  return result.updated;
}
/** Legacy name-based UI cannot identify duplicates; refuse rather than merge them. */
export async function renameStudentOnDrive(oldName: string, newName: string): Promise<number> {
  const students = (await getStudents()).filter(s => s.name.toLowerCase() === oldName.toLowerCase());
  if (students.length !== 1) throw new Error('Selecteer de leerling via het leerlingregister.');
  await updateStudent({ ...students[0], name: newName });
  return 1;
}
export async function fetchReportPages(path: '/teacher/reports' | '/student/reports'): Promise<DriveRow[]> {
  const rows: DriveRow[] = [];
  let cursor: string | null = null;
  const seen = new Set<string>();
  do {
    const page: { rows: DriveRow[]; nextCursor: string | null } = await api(path, cursor ? { cursor } : {});
    if (!Array.isArray(page.rows)) throw new Error('Dienst niet beschikbaar.');
    rows.push(...page.rows);
    cursor = page.nextCursor;
    if (cursor) {
      if (seen.has(cursor)) throw new Error('Dienst niet beschikbaar.');
      seen.add(cursor);
    }
  } while (cursor);
  return rows;
}
export const fetchReports = () => fetchReportPages('/teacher/reports');
