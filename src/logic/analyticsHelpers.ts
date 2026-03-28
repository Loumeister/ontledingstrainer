/**
 * analyticsHelpers — Zuivere analyticsfuncties voor Ontleedlab.
 *
 * Geen side-effects, geen localStorage-toegang. Alle functies ontvangen
 * data als parameters en geven berekende samenvattingen terug.
 *
 * Twee niveaus:
 * 1. Domein-specifiek (TrainerSubmission): `computeTrainerStudentProgress`,
 *    `computeTrainerClassProgress`, `computeRoleErrorPatterns`,
 *    `computeAssignmentParticipation` — voor trainer-dashboards.
 *
 * 2. Cross-domein (AnySubmission): `computeCrossDomainStudentActivity`,
 *    `computeCrossDomainKlasSummary` — aggregeren over trainer + lab sessies.
 *    Gebruik `activityStore.getAllSubmissions()` als input.
 *
 * Compat-adapter: `buildTrainerSubmissionFromReport` — converteert legacy
 * SessionReport naar TrainerSubmission voor dashboardweergave.
 */

import type { TrainerSubmission, TrainerAttempt, AnySubmission } from '../types';
import type { SessionReport } from '../services/sessionReport';

// ── Output types ──────────────────────────────────────────────────────────────

/** Voortgangssamenvatting voor één student, berekend uit diens submissions. */
export interface TrainerProgressSummary {
  studentId: string;
  /** Aantal voltooide sessies. */
  sessionCount: number;
  /** Gemiddelde score over alle sessies (0–100). */
  avgScore: number;
  /** Hoogste behaalde score (0–100). */
  bestScore: number;
  /** Score van de meest recente sessie (0–100). */
  latestScore: number;
  /** ISO-timestamp van de meest recente voltooide sessie. */
  latestTs: string;
  /** Top-5 rollen met de meeste fouten, gesorteerd aflopend. */
  topErrors: Array<{ role: string; count: number }>;
  /** Tijdlijn van scores; één punt per sessie, gesorteerd op datum. */
  scoreHistory: Array<{ ts: string; score: number }>;
}

/** Klassamenvatting: aggregatie over alle studenten en sessies in een klas. */
export interface TrainerClassSummary {
  klas: string;
  /** Aantal unieke studenten met ≥1 voltooide sessie. */
  studentCount: number;
  /** Totaal aantal voltooide sessies in de klas. */
  sessionCount: number;
  /** Gemiddelde score over alle sessies in de klas (0–100). */
  avgScore: number;
  /**
   * Participatiefractie (0–1).
   * Als `knownStudentIds` is meegegeven: unieke actieve studenten / totale klasgrootte.
   * Anders: altijd 1.0 (alle bekende studenten zijn actief).
   */
  participationRate: number;
  /** Top-5 rolfouten in de klas, gesorteerd aflopend. */
  topErrors: Array<{ role: string; count: number }>;
}

/** Samenvatting van fouten per grammaticale rol over een set submissions. */
export interface RoleErrorSummary {
  /** Rolsleutel, bijv. 'pv', 'ow', 'bwb'. */
  role: string;
  /** Totaal aantal keer dat deze rol fout was over alle submissions. */
  totalErrors: number;
  /** Aantal unieke studenten die minstens één fout maakten op deze rol. */
  affectedStudents: number;
}

/** Deelnamesamenvatting voor een specifieke versie van een opdracht. */
export interface ParticipationSummary {
  assignmentId: string;
  version: number;
  /** Totaal aantal submissions (inclusief onvoltooide). */
  submissionCount: number;
  /** Aantal unieke studenten die aan de opdracht begonnen zijn. */
  uniqueStudents: number;
  /** Gemiddelde score van voltooide submissions (0–100). */
  avgScore: number;
  /** Fractie submissions met `completedAt` (0–1). */
  completionRate: number;
}

// ── Student progress ──────────────────────────────────────────────────────────

/**
 * Bereken voortgangssamenvatting voor één student op basis van diens submissions.
 * Submissions hoeven niet gesorteerd te zijn.
 */
export function computeTrainerStudentProgress(
  submissions: TrainerSubmission[],
  studentId: string,
): TrainerProgressSummary {
  const mine = submissions
    .filter(s => s.studentId === studentId && s.completedAt)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  if (mine.length === 0) {
    return {
      studentId,
      sessionCount: 0,
      avgScore: 0,
      bestScore: 0,
      latestScore: 0,
      latestTs: '',
      topErrors: [],
      scoreHistory: [],
    };
  }

  const scores = mine.map(s =>
    s.scoreTotal > 0 ? (s.scoreCorrect / s.scoreTotal) * 100 : 0,
  );

  const errorMap: Record<string, number> = {};
  for (const s of mine) {
    for (const [role, count] of Object.entries(s.mistakeStats)) {
      errorMap[role] = (errorMap[role] ?? 0) + count;
    }
  }

  const topErrors = Object.entries(errorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([role, count]) => ({ role, count }));

  const latest = mine[mine.length - 1];

  return {
    studentId,
    sessionCount: mine.length,
    avgScore: scores.reduce((a, s) => a + s, 0) / scores.length,
    bestScore: Math.max(...scores),
    latestScore: scores[scores.length - 1],
    latestTs: latest.completedAt ?? latest.startedAt,
    topErrors,
    scoreHistory: mine.map((s, i) => ({
      ts: s.completedAt ?? s.startedAt,
      score: scores[i],
    })),
  };
}

// ── Class progress ────────────────────────────────────────────────────────────

/**
 * Bereken klassamenvatting: gemiddelde score, participatie, fouten.
 * knownStudentIds: optionele lijst van alle bekende studenten in de klas
 * (voor participatiepercentage; als leeg worden alleen submission-studenten geteld).
 */
export function computeTrainerClassProgress(
  submissions: TrainerSubmission[],
  klas: string,
  knownStudentIds?: string[],
): TrainerClassSummary {
  const normKlas = klas.trim().toLowerCase();
  const klasSubs = submissions.filter(
    s => s.studentKlas.trim().toLowerCase() === normKlas && s.completedAt,
  );

  const studentIds = new Set(klasSubs.map(s => s.studentId));
  const totalStudents = knownStudentIds?.length ?? studentIds.size;

  const scores = klasSubs.map(s =>
    s.scoreTotal > 0 ? (s.scoreCorrect / s.scoreTotal) * 100 : 0,
  );

  const errorMap: Record<string, number> = {};
  for (const s of klasSubs) {
    for (const [role, count] of Object.entries(s.mistakeStats)) {
      errorMap[role] = (errorMap[role] ?? 0) + count;
    }
  }

  return {
    klas: normKlas,
    studentCount: studentIds.size,
    sessionCount: klasSubs.length,
    avgScore: scores.length > 0 ? scores.reduce((a, s) => a + s, 0) / scores.length : 0,
    participationRate: totalStudents > 0 ? studentIds.size / totalStudents : 0,
    topErrors: Object.entries(errorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role, count]) => ({ role, count })),
  };
}

// ── Role error patterns ───────────────────────────────────────────────────────

/**
 * Aggregeer rolfouten over alle submissions.
 * Geeft een gesorteerde lijst (meest fouten eerst).
 */
export function computeRoleErrorPatterns(
  submissions: TrainerSubmission[],
): RoleErrorSummary[] {
  const errorMap: Record<string, { total: number; students: Set<string> }> = {};

  for (const s of submissions) {
    for (const [role, count] of Object.entries(s.mistakeStats)) {
      if (!errorMap[role]) errorMap[role] = { total: 0, students: new Set() };
      errorMap[role].total += count;
      errorMap[role].students.add(s.studentId);
    }
  }

  return Object.entries(errorMap)
    .map(([role, { total, students }]) => ({
      role,
      totalErrors: total,
      affectedStudents: students.size,
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors);
}

// ── Assignment participation ──────────────────────────────────────────────────

/**
 * Bereken deelnamesamenvatting voor één versie van een opdracht.
 *
 * @param assignmentId - Het stabiele `TrainerAssignment.id`.
 * @param version      - De specifieke versie waarvoor deelname wordt berekend.
 * @param submissions  - Alle beschikbare submissions (wordt intern gefilterd).
 * @returns Samenvatting inclusief aantallen, gemiddelde score en voltooiingsfractie.
 */
export function computeAssignmentParticipation(
  assignmentId: string,
  version: number,
  submissions: TrainerSubmission[],
): ParticipationSummary {
  const relevant = submissions.filter(
    s => s.assignmentId === assignmentId && s.assignmentVersion === version,
  );

  const uniqueStudents = new Set(relevant.map(s => s.studentId)).size;
  const completed = relevant.filter(s => s.completedAt);
  const scores = completed.map(s =>
    s.scoreTotal > 0 ? (s.scoreCorrect / s.scoreTotal) * 100 : 0,
  );

  return {
    assignmentId,
    version,
    submissionCount: relevant.length,
    uniqueStudents,
    avgScore: scores.length > 0 ? scores.reduce((a, s) => a + s, 0) / scores.length : 0,
    completionRate: relevant.length > 0 ? completed.length / relevant.length : 0,
  };
}

// ── Attempt-level helpers ─────────────────────────────────────────────────────

/**
 * Aggregeer rolfouten uit TrainerAttempts (gedetailleerder dan submission-level).
 *
 * **STUB — nog niet geïmplementeerd.** Geeft altijd een lege array terug.
 *
 * Waarom een stub?
 * TrainerAttempt slaat in `userLabels` de *door de student opgegeven* rollen op,
 * maar weet niet welke fout zijn. De validatielaag (`src/logic/validation.ts`)
 * bepaalt correctheid, maar wordt hier niet aangeroepen omdat analyticsHelpers
 * bewust geen side-effects heeft en geen domeinlogica importeert.
 *
 * Toekomstige implementatie: vergelijk `userLabels` met de bijbehorende
 * Sentence-token-rollen, of sla de gecorrigeerde rolfouten al op in TrainerAttempt
 * (zoals de bestaande `mistakeStats` op TrainerSubmission-niveau doen).
 * Gebruik `computeRoleErrorPatterns(submissions)` als huidige workaround.
 *
 * @param attempts - Lijst van TrainerAttempts (momenteel genegeerd).
 * @returns Altijd een lege array totdat de implementatie is voltooid.
 */
export function computeAttemptRoleErrors(
  attempts: TrainerAttempt[],
): RoleErrorSummary[] {
  // Huidige scope: submission-level mistakeStats zijn voldoende voor dashboards.
  // Attempt-niveau foutanalyse vereist toegang tot de Sentence-data; deferred.
  void attempts;
  return [];
}

// ── Cross-domain aggregation ──────────────────────────────────────────────────

/**
 * Samenvatting van studentactiviteit over beide domeinen (trainer + lab).
 * Gebruikt als input voor een gecombineerd voortgangsdashboard.
 */
export interface CrossDomainStudentSummary {
  /** Naam of studentId waarvoor de samenvatting is berekend. */
  studentKey: string;
  /** Totaal voltooide sessies (trainer + lab). */
  totalSessions: number;
  /** Voltooide trainer-sessies (ontledingsoefeningen). */
  trainerSessions: number;
  /** Voltooide lab-sessies (Zinsdeellab). */
  labSessions: number;
  /** Gemiddelde score van trainer-sessies (0–100), NaN als geen trainer-sessies. */
  trainerAvgScore: number;
  /** ISO-timestamp van de meest recente sessie over beide domeinen. */
  latestTs: string;
}

/**
 * Bereken gecombineerde activiteitssamenvatting voor één student over beide domeinen.
 *
 * @param submissions - AnySubmission[]-lijst (van activityStore.getAllSubmissions()).
 * @param studentKey  - Naam of Student.id om op te filteren.
 * @returns CrossDomainStudentSummary over alle domeinen.
 */
export function computeCrossDomainStudentActivity(
  submissions: AnySubmission[],
  studentKey: string,
): CrossDomainStudentSummary {
  const norm = studentKey.trim().toLowerCase();

  const mine = submissions.filter(s => {
    if (s.domain === 'trainer') {
      return (
        s.studentId === studentKey ||
        s.studentName.trim().toLowerCase() === norm
      );
    }
    return s.studentName.trim().toLowerCase() === norm;
  }).filter(s => s.completedAt);

  const trainerSubs = mine.filter(s => s.domain === 'trainer');
  const labSubs = mine.filter(s => s.domain === 'lab');

  const trainerScores = trainerSubs.map(s =>
    s.domain === 'trainer' && s.scoreTotal > 0
      ? (s.scoreCorrect / s.scoreTotal) * 100
      : 0,
  );

  const allTs = mine
    .map(s => s.completedAt ?? s.startedAt)
    .sort((a, b) => b.localeCompare(a));

  return {
    studentKey,
    totalSessions: mine.length,
    trainerSessions: trainerSubs.length,
    labSessions: labSubs.length,
    trainerAvgScore:
      trainerScores.length > 0
        ? trainerScores.reduce((a, s) => a + s, 0) / trainerScores.length
        : NaN,
    latestTs: allTs[0] ?? '',
  };
}

/**
 * Samenvatting per klas over beide domeinen.
 */
export interface CrossDomainKlasSummary {
  klas: string;
  /** Unieke studentnamen actief in de klas over beide domeinen. */
  uniqueStudents: number;
  /** Totaal voltooide sessies in de klas. */
  totalSessions: number;
  /** Voltooide trainer-sessies in de klas. */
  trainerSessions: number;
  /** Voltooide lab-sessies in de klas. */
  labSessions: number;
  /** Gemiddelde trainer-score voor de klas (0–100), NaN als geen trainer-sessies. */
  trainerAvgScore: number;
}

/**
 * Bereken activiteitssamenvatting per klas over beide domeinen.
 *
 * @param submissions - AnySubmission[]-lijst (van activityStore.getAllSubmissions()).
 * @param klas        - Klasnaam (case-insensitief), bijv. '2B'.
 * @returns CrossDomainKlasSummary voor de klas.
 */
export function computeCrossDomainKlasSummary(
  submissions: AnySubmission[],
  klas: string,
): CrossDomainKlasSummary {
  const normKlas = klas.trim().toLowerCase();
  const klasSubs = submissions.filter(
    s => s.studentKlas.trim().toLowerCase() === normKlas && s.completedAt,
  );

  const studentKeys = new Set(
    klasSubs.map(s =>
      s.domain === 'trainer' ? s.studentId : s.studentName.trim().toLowerCase(),
    ),
  );

  const trainerSubs = klasSubs.filter(s => s.domain === 'trainer');
  const labSubs = klasSubs.filter(s => s.domain === 'lab');
  const trainerScores = trainerSubs.map(s =>
    s.domain === 'trainer' && s.scoreTotal > 0
      ? (s.scoreCorrect / s.scoreTotal) * 100
      : 0,
  );

  return {
    klas: normKlas,
    uniqueStudents: studentKeys.size,
    totalSessions: klasSubs.length,
    trainerSessions: trainerSubs.length,
    labSessions: labSubs.length,
    trainerAvgScore:
      trainerScores.length > 0
        ? trainerScores.reduce((a, s) => a + s, 0) / trainerScores.length
        : NaN,
  };
}

// ── Compatibility adapter: SessionReport → TrainerSubmission ──────────────────

/**
 * Compatibiliteitsadapter: converteer een bestaand SessionReport naar een
 * gedeeltelijke TrainerSubmission voor weergave in het nieuwe dashboard.
 *
 * `studentId` is opzettelijk weggelaten: SessionReport bevat alleen
 * `name` en `klas`, niet het stabiele `Student.id`. Aanroepende code kan
 * `studentId` ophalen via `studentStore.getOrCreateStudent()` als nodig.
 *
 * Het gegenereerde `id` begint met `legacy-` om eenvoudig te onderscheiden
 * van echte domein-submissions (prefix `tsub-`).
 *
 * @param report - Een SessionReport zoals opgeslagen in `zinsontleding_reports_v1`
 *                 of gesynchroniseerd via Google Drive.
 * @returns Een partial TrainerSubmission zonder `studentId`, klaar voor dashboardweergave.
 */
export function buildTrainerSubmissionFromReport(
  report: SessionReport,
): Omit<TrainerSubmission, 'studentId'> {
  return {
    domain: 'trainer',
    id: `legacy-${report.ts.replace(/[:.]/g, '-')}`,
    studentName: report.name,
    studentKlas: report.klas ?? '',
    assignmentId: null,
    assignmentVersion: null,
    startedAt: report.ts,
    completedAt: report.ts,
    scoreCorrect: report.c,
    scoreTotal: report.t,
    levelPlayed: report.lvl,
    showAnswerCount: report.hint ?? 0,
    durationSeconds: report.dur ?? null,
    mistakeStats: report.err ?? {},
  };
}
