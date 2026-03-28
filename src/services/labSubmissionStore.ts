/**
 * labSubmissionStore — Persistentie voor Zinsdeellab-studentpogingen.
 *
 * Opslag: localStorage, key 'zinsdeellab_submissions_v1' (max 500)
 * Elke LabSubmission bevat exerciseVersion zodat resultaten altijd
 * attributeerbaar zijn aan de exacte oefening-versie.
 *
 * domain: 'lab' wordt altijd geschreven en bij uitlezen genormaliseerd,
 * zodat activityStore en analyticsHelpers cross-domain kunnen aggregeren.
 *
 * Toekomstige MVPs kunnen hier bovenop:
 * - Docent-dashboard met resultaten per klas/exercise
 * - Export naar CSV/JSON voor analyse
 * - Sync naar Google Drive of backend
 *
 * Bewust weggelaten:
 * - Server-side opslag
 * - Paginering / lazy loading
 * - Geaggregeerde statistieken (die horen in analyticsHelpers)
 */

import type { LabSubmission } from '../types';

const SUBMISSION_KEY = 'zinsdeellab_submissions_v1';
const MAX_SUBMISSIONS = 500;

/**
 * Laadt alle opgeslagen LabSubmissions uit localStorage.
 *
 * Normaliseert ontbrekende `domain`-velden: records opgeslagen vóór de
 * introductie van de discriminator krijgen `domain: 'lab'` toegewezen.
 *
 * @returns Alle submissions (genormaliseerd), oudste eerst.
 */
export function getSubmissions(): LabSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as LabSubmission[]) : [];
    // Migratie: voeg domain toe aan records zonder dat veld
    return parsed.map(s => (s.domain === 'lab' ? s : { ...s, domain: 'lab' as const }));
  } catch {
    return [];
  }
}

function saveSubmissions(submissions: LabSubmission[]): void {
  try {
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Slaat een LabSubmission op of werkt een bestaande bij (upsert op `id`).
 * Zorgt dat `domain: 'lab'` altijd aanwezig is in de opgeslagen data.
 * Trimt tot MAX_SUBMISSIONS (oudste eerst) als het maximum bereikt is.
 *
 * @param submission - De volledige LabSubmission om op te slaan.
 */
export function saveSubmission(submission: LabSubmission): void {
  // Zorg dat domain altijd aanwezig is in opgeslagen data
  const normalized: LabSubmission = { ...submission, domain: 'lab' };
  const submissions = getSubmissions();
  const idx = submissions.findIndex(s => s.id === normalized.id);
  if (idx >= 0) {
    submissions[idx] = normalized;
  } else {
    submissions.push(normalized);
  }
  if (submissions.length > MAX_SUBMISSIONS) {
    submissions.splice(0, submissions.length - MAX_SUBMISSIONS);
  }
  saveSubmissions(submissions);
}

/**
 * Geeft alle submissions terug voor een specifieke oefening.
 *
 * @param exerciseId - Het `ZinsdeellabExercise.id` van de oefening.
 * @returns Submissions voor deze oefening, oudste eerst.
 */
export function getSubmissionsForExercise(exerciseId: string): LabSubmission[] {
  return getSubmissions().filter(s => s.exerciseId === exerciseId);
}

/**
 * Geeft alle submissions terug voor een student op naam (case-insensitief).
 *
 * LabSubmission heeft nog geen stabiel studentId; match is op naam.
 * Gebruik `activityStore.getAllSubmissionsForStudent()` voor cross-domain queries.
 *
 * @param studentName - Naam van de student.
 * @returns Submissions voor deze student, oudste eerst.
 */
export function getSubmissionsForStudent(studentName: string): LabSubmission[] {
  const norm = studentName.trim().toLowerCase();
  return getSubmissions().filter(s => s.studentName.trim().toLowerCase() === norm);
}

/**
 * Triggert een browser-download van alle LabSubmissions als JSON-bestand.
 * Bestandsnaam: `zinsdeellab_submissions_YYYY-MM-DD.json`.
 */
export function exportSubmissionsAsJson(): void {
  const submissions = getSubmissions();
  const blob = new Blob([JSON.stringify(submissions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zinsdeellab_submissions_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Genereert een uniek submission-ID: `sub-{ISO-datum-zonder-tekens}-{4-cijfer-getal}`.
 *
 * @returns Een stabiel, globaal uniek string-ID voor een LabSubmission.
 */
export function generateSubmissionId(): string {
  return `sub-${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.floor(Math.random() * 9000) + 1000}`;
}
