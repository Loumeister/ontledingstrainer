/**
 * trainerSubmissionStore — Persistentie voor Ontleedlab-studentpogingen.
 *
 * Opslag: localStorage
 *   'zinsontleding_submissions_v1' → TrainerSubmission[] (max 500)
 *   'zinsontleding_attempts_v1'    → TrainerAttempt[]    (max 2000)
 *
 * Parallel aan labSubmissionStore (Zinsdeellab) — zelfde opslagpatroon.
 * TrainerSubmissions refereren aan studentId (stabiel) en optioneel
 * assignmentId + assignmentVersion voor attributie aan versioned opdrachten.
 *
 * Bewust weggelaten:
 * - Server-side opslag / sync (toekomstige MVP)
 * - Paginering / lazy loading
 * - Geaggregeerde statistieken (horen in analyticsHelpers)
 */

import type { TrainerSubmission, TrainerAttempt } from '../types';

const SUBMISSION_KEY = 'zinsontleding_submissions_v1';
const ATTEMPT_KEY = 'zinsontleding_attempts_v1';
const MAX_SUBMISSIONS = 500;
const MAX_ATTEMPTS = 2000;

// ── ID generators ─────────────────────────────────────────────────────────────

export function generateSubmissionId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `tsub-${ts}-${rand}`;
}

export function generateAttemptId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `tatt-${ts}-${rand}`;
}

// ── Submission persistence ────────────────────────────────────────────────────

export function getSubmissions(): TrainerSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    return raw ? (JSON.parse(raw) as TrainerSubmission[]) : [];
  } catch {
    return [];
  }
}

function saveSubmissions(submissions: TrainerSubmission[]): void {
  try {
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions));
  } catch {
    // localStorage may be unavailable
  }
}

/** Upsert een submission op basis van id. Trim tot MAX_SUBMISSIONS (oudste eerst). */
export function saveSubmission(submission: TrainerSubmission): void {
  const submissions = getSubmissions();
  const idx = submissions.findIndex(s => s.id === submission.id);
  if (idx >= 0) {
    submissions[idx] = submission;
  } else {
    submissions.push(submission);
    if (submissions.length > MAX_SUBMISSIONS) {
      submissions.splice(0, submissions.length - MAX_SUBMISSIONS);
    }
  }
  saveSubmissions(submissions);
}

export function getSubmissionsForStudent(studentId: string): TrainerSubmission[] {
  return getSubmissions().filter(s => s.studentId === studentId);
}

export function getSubmissionsForAssignment(
  assignmentId: string,
  version?: number,
): TrainerSubmission[] {
  return getSubmissions().filter(
    s =>
      s.assignmentId === assignmentId &&
      (version === undefined || s.assignmentVersion === version),
  );
}

export function exportSubmissionsAsJson(): void {
  const submissions = getSubmissions();
  const blob = new Blob([JSON.stringify(submissions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trainer_submissions_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Attempt persistence ───────────────────────────────────────────────────────

export function getAttempts(): TrainerAttempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    return raw ? (JSON.parse(raw) as TrainerAttempt[]) : [];
  } catch {
    return [];
  }
}

function saveAttempts(attempts: TrainerAttempt[]): void {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempts));
  } catch {
    // localStorage may be unavailable
  }
}

/** Upsert een attempt op basis van id. Trim tot MAX_ATTEMPTS (oudste eerst). */
export function saveAttempt(attempt: TrainerAttempt): void {
  const attempts = getAttempts();
  const idx = attempts.findIndex(a => a.id === attempt.id);
  if (idx >= 0) {
    attempts[idx] = attempt;
  } else {
    attempts.push(attempt);
    if (attempts.length > MAX_ATTEMPTS) {
      attempts.splice(0, attempts.length - MAX_ATTEMPTS);
    }
  }
  saveAttempts(attempts);
}

export function getAttemptsForSubmission(submissionId: string): TrainerAttempt[] {
  return getAttempts().filter(a => a.submissionId === submissionId);
}
