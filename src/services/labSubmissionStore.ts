/**
 * labSubmissionStore — Persistentie voor Zinsdeellab-studentpogingen.
 *
 * Opslag: localStorage, key 'zinsdeellab_submissions_v1'
 * Elke LabSubmission bevat exerciseVersion zodat resultaten altijd
 * attributeerbaar zijn aan de exacte oefening-versie.
 *
 * Toekomstige MVPs kunnen hier bovenop:
 * - Docent-dashboard met resultaten per klas/exercise
 * - Export naar CSV/JSON voor analyse
 * - Sync naar Google Drive of backend
 *
 * Bewust weggelaten:
 * - Server-side opslag
 * - Paginering / lazy loading
 * - Geaggregeerde statistieken (die horen in een aparte analytics-laag)
 */

import type { LabSubmission } from '../types';

const SUBMISSION_KEY = 'zinsdeellab_submissions_v1';
const MAX_SUBMISSIONS = 500;

export function getSubmissions(): LabSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    return raw ? (JSON.parse(raw) as LabSubmission[]) : [];
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

export function saveSubmission(submission: LabSubmission): void {
  const submissions = getSubmissions();
  const idx = submissions.findIndex(s => s.id === submission.id);
  if (idx >= 0) {
    submissions[idx] = submission;
  } else {
    submissions.push(submission);
  }
  // Trim oudste entries als maximum bereikt
  if (submissions.length > MAX_SUBMISSIONS) {
    submissions.splice(0, submissions.length - MAX_SUBMISSIONS);
  }
  saveSubmissions(submissions);
}

export function getSubmissionsForExercise(exerciseId: string): LabSubmission[] {
  return getSubmissions().filter(s => s.exerciseId === exerciseId);
}

export function getSubmissionsForStudent(studentName: string): LabSubmission[] {
  const norm = studentName.trim().toLowerCase();
  return getSubmissions().filter(s => s.studentName.trim().toLowerCase() === norm);
}

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

/** Genereer een stabiel submission-id: ISO-timestamp + 4-cijferig random getal */
export function generateSubmissionId(): string {
  return `sub-${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.floor(Math.random() * 9000) + 1000}`;
}
