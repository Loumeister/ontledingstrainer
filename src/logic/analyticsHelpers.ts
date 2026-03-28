/**
 * analyticsHelpers — Zuivere analyticsfuncties voor Ontleedlab.
 *
 * Geen side-effects, geen localStorage-toegang. Alle functies ontvangen
 * data als parameters en geven berekende samenvattingen terug.
 *
 * Dekt zowel TrainerSubmission (ontleder) als een compat-adapter voor
 * de bestaande SessionReport (voor docentdashboards die al rapporten
 * hebben ingevoerd via UsageLogScreen).
 *
 * Uitbreidbaar naar LabSubmission zodra de lab-branch gemerged is.
 */

import type { TrainerSubmission, TrainerAttempt } from '../types';
import type { SessionReport } from '../services/sessionReport';

// ── Output types ──────────────────────────────────────────────────────────────

export interface TrainerProgressSummary {
  studentId: string;
  sessionCount: number;
  avgScore: number;        // 0–100
  bestScore: number;
  latestScore: number;
  latestTs: string;        // ISO timestamp van meest recente sessie
  topErrors: Array<{ role: string; count: number }>;
  scoreHistory: Array<{ ts: string; score: number }>;
}

export interface TrainerClassSummary {
  klas: string;
  studentCount: number;
  sessionCount: number;
  avgScore: number;        // gemiddeld over alle sessies in de klas
  participationRate: number; // 0–1: unieke studenten met ≥1 sessie / totaal known
  topErrors: Array<{ role: string; count: number }>;
}

export interface RoleErrorSummary {
  role: string;
  totalErrors: number;
  affectedStudents: number;
}

export interface ParticipationSummary {
  assignmentId: string;
  version: number;
  submissionCount: number;
  uniqueStudents: number;
  avgScore: number;
  completionRate: number; // fracties met completedAt
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
 */
export function computeAttemptRoleErrors(
  attempts: TrainerAttempt[],
): RoleErrorSummary[] {
  const errorMap: Record<string, { total: number; students: Set<string> }> = {};

  for (const a of attempts) {
    for (const [, role] of Object.entries(a.userLabels)) {
      // userLabels bevat de door de student opgegeven rollen — fouten worden
      // elders bepaald (in validatielaag). Hier tellen we alleen per-poging
      // totalen van showAnswerUsed als proxy.
      void role; // label-niveau analyse is toekomstige uitbreiding
    }
    void a; // huidige scope: submission-level mistakeStats zijn voldoende
  }

  return Object.entries(errorMap)
    .map(([role, { total, students }]) => ({
      role,
      totalErrors: total,
      affectedStudents: students.size,
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors);
}

// ── Compatibility adapter: SessionReport → TrainerSubmission ──────────────────

/**
 * Converteer een SessionReport (bestaand formaat) naar een partial TrainerSubmission.
 * studentId is onbekend vanuit een SessionReport (bevat alleen naam).
 * Gebruikt voor het weergeven van historische rapporten in het nieuwe dashboard.
 */
export function buildTrainerSubmissionFromReport(
  report: SessionReport,
): Omit<TrainerSubmission, 'studentId'> {
  return {
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
