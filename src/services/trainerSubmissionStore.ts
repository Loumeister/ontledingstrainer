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

/**
 * Genereert een uniek submission-ID in het formaat `tsub-{ISO-datum-zonder-tekens}-{4-cijfer-getal}`.
 *
 * Het ID wordt aangemaakt vóórdat de submission wordt opgeslagen, zodat de aanroeper
 * het ID al kent (bijv. om het mee te sturen naar een activiteitslog) zonder
 * eerst te hoeven opslaan.
 *
 * @returns Een stabiel, globaal uniek string-ID voor een TrainerSubmission.
 */
export function generateSubmissionId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `tsub-${ts}-${rand}`;
}

/**
 * Genereert een uniek attempt-ID in het formaat `tatt-{ISO-datum-zonder-tekens}-{4-cijfer-getal}`.
 *
 * Zelfde patroon als `generateSubmissionId()`, maar met prefix `tatt` zodat
 * attempts en submissions altijd te onderscheiden zijn op ID-prefix.
 *
 * @returns Een stabiel, globaal uniek string-ID voor een TrainerAttempt.
 */
export function generateAttemptId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `tatt-${ts}-${rand}`;
}

// ── Submission persistence ────────────────────────────────────────────────────

/**
 * Laadt alle opgeslagen TrainerSubmissions uit localStorage.
 *
 * Normaliseert ontbrekende `domain`-velden: records die zijn opgeslagen vóór
 * de introductie van de `domain`-discriminator krijgen `domain: 'trainer'`
 * toegewezen. Zo zijn alle teruggegeven records geldig als `TrainerSubmission`.
 *
 * @returns Alle submissions (genormaliseerd), oudste eerst.
 */
export function getSubmissions(): TrainerSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as TrainerSubmission[]) : [];
    // Migratie: voeg domain toe aan records zonder dat veld (opgeslagen vóór unificatie)
    return parsed.map(s => (s.domain === 'trainer' ? s : { ...s, domain: 'trainer' as const }));
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

/**
 * Slaat een TrainerSubmission op of werkt een bestaande bij (upsert op `id`).
 *
 * Als een submission met hetzelfde id al bestaat, wordt die overschreven.
 * Zo kunnen sessies progressief worden bijgewerkt: eerst `startedAt` opslaan,
 * later de voltooide scores en `completedAt` toevoegen.
 *
 * Bij meer dan MAX_SUBMISSIONS (500) entries worden de oudste bijgesneden
 * om de localStorage-grootte beheersbaar te houden.
 *
 * @param submission - De volledige (of bijgewerkte) TrainerSubmission om op te slaan.
 */
export function saveSubmission(submission: TrainerSubmission): void {
  // Zorg dat domain altijd aanwezig is in opgeslagen data
  const normalized: TrainerSubmission = { ...submission, domain: 'trainer' };
  const submissions = getSubmissions();
  const idx = submissions.findIndex(s => s.id === normalized.id);
  if (idx >= 0) {
    submissions[idx] = normalized;
  } else {
    submissions.push(normalized);
    if (submissions.length > MAX_SUBMISSIONS) {
      submissions.splice(0, submissions.length - MAX_SUBMISSIONS);
    }
  }
  saveSubmissions(submissions);
}

/**
 * Geeft alle submissions terug die zijn gekoppeld aan een specifieke student.
 *
 * @param studentId - Het stabiele `Student.id` (niet de naam) van de student.
 * @returns Submissions voor deze student, oudste eerst.
 */
export function getSubmissionsForStudent(studentId: string): TrainerSubmission[] {
  return getSubmissions().filter(s => s.studentId === studentId);
}

/**
 * Geeft alle submissions terug die zijn gekoppeld aan een specifieke opdracht.
 *
 * Als `version` wordt meegegeven, worden alleen submissions voor die exacte
 * versie teruggegeven. Zonder `version` worden submissions voor ál de versies
 * van die opdracht teruggegeven — handig om deelname over versies heen te bekijken.
 *
 * @param assignmentId - Het stabiele `TrainerAssignment.id`.
 * @param version      - (Optioneel) filter op een specifieke versie.
 * @returns Matching submissions, oudste eerst.
 */
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

/**
 * Triggert een browser-download van alle submissions als JSON-bestand.
 *
 * Bedoeld voor docenten die ruwe data willen exporteren voor eigen analyse.
 * Bestandsnaam: `trainer_submissions_YYYY-MM-DD.json`.
 *
 * Heeft geen retourwaarde; side-effect is het aanmaken van een download via
 * een tijdelijk `<a>`-element.
 */
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

/**
 * Laadt alle opgeslagen TrainerAttempts uit localStorage.
 *
 * Geeft een lege array terug als de sleutel ontbreekt of de JSON niet geldig is.
 *
 * @returns Alle attempts, gesorteerd op volgorde van opslaan (oudste eerst).
 */
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

/**
 * Slaat een TrainerAttempt op of werkt een bestaande bij (upsert op `id`).
 *
 * Een attempt vertegenwoordigt één zin binnen een sessie. Bij meer dan
 * MAX_ATTEMPTS (2000) worden de oudste bijgesneden.
 *
 * Attempts worden doorgaans pas aan het einde van een sessie opgeslagen
 * (in `nextSessionSentence()` in useTrainer), niet tussendoor.
 *
 * @param attempt - De volledige TrainerAttempt om op te slaan.
 */
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

/**
 * Geeft alle attempts terug die horen bij een specifieke submission.
 *
 * @param submissionId - Het `TrainerSubmission.id` van de bovenliggende sessie.
 * @returns Attempts voor deze submission, oudste eerst.
 */
export function getAttemptsForSubmission(submissionId: string): TrainerAttempt[] {
  return getAttempts().filter(a => a.submissionId === submissionId);
}
