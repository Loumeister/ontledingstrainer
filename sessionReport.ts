/**
 * Session Report: encode/decode/store compact session summaries.
 *
 * Students generate a report code after each session (ScoreScreen).
 * Teachers paste codes into the UsageLogScreen to aggregate external data.
 *
 * Format: base64url-encoded JSON with a version prefix ("v1:").
 */

export interface SessionReport {
  /** Version tag for forward-compat */
  v: 1;
  /** Student nickname (optional, user-provided) */
  name: string;
  /** ISO-8601 timestamp */
  ts: string;
  /** Correct chunks */
  c: number;
  /** Total chunks */
  t: number;
  /** Difficulty level played (1-4, null for mixed) */
  lvl: number | null;
  /** Role error counts: { roleKey: count } */
  err: Record<string, number>;
  /** Sentence IDs attempted */
  sids: number[];
}

const STORAGE_KEY = 'zinsontleding_reports_v1';

// --- Encode / Decode ---

export function encodeReport(report: SessionReport): string {
  const json = JSON.stringify(report);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return `v1:${btoa(binary)}`;
}

export function decodeReport(code: string): SessionReport | null {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith('v1:')) return null;
    const base64 = trimmed.slice(3);
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (parsed.v !== 1 || typeof parsed.c !== 'number' || typeof parsed.t !== 'number') {
      return null;
    }
    return parsed as SessionReport;
  } catch {
    return null;
  }
}

// --- Persistence ---

export function loadReports(): SessionReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReports(reports: SessionReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // localStorage unavailable
  }
}

export function addReport(report: SessionReport): void {
  const reports = loadReports();
  reports.push(report);
  saveReports(reports);
}

export function clearReports(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Build a report from session data ---

export function buildReport(
  name: string,
  correct: number,
  total: number,
  mistakeStats: Record<string, number>,
  level: number | null,
  sentenceIds: number[],
): SessionReport {
  // Only include non-zero errors
  const err: Record<string, number> = {};
  for (const [k, v] of Object.entries(mistakeStats)) {
    if (v > 0) err[k] = v;
  }
  return {
    v: 1,
    name,
    ts: new Date().toISOString(),
    c: correct,
    t: total,
    lvl: level,
    err,
    sids: sentenceIds,
  };
}

// --- Aggregate statistics from imported reports ---

export interface AggregateStats {
  totalReports: number;
  uniqueStudents: number;
  totalCorrect: number;
  totalChunks: number;
  avgScore: number;
  globalRoleErrors: Record<string, number>;
  levelDistribution: Record<number, number>;
  reportsPerDay: Record<string, number>;
  studentNames: string[];
}

export function computeAggregateStats(reports: SessionReport[]): AggregateStats {
  const names = new Set<string>();
  let totalCorrect = 0;
  let totalChunks = 0;
  const globalRoleErrors: Record<string, number> = {};
  const levelDistribution: Record<number, number> = {};
  const reportsPerDay: Record<string, number> = {};

  for (const r of reports) {
    const trimmedName = r.name.trim().toLowerCase();
    if (trimmedName) names.add(trimmedName);
    totalCorrect += r.c;
    totalChunks += r.t;

    for (const [role, count] of Object.entries(r.err)) {
      globalRoleErrors[role] = (globalRoleErrors[role] || 0) + count;
    }

    if (r.lvl != null) {
      levelDistribution[r.lvl] = (levelDistribution[r.lvl] || 0) + 1;
    }

    const day = r.ts.slice(0, 10); // YYYY-MM-DD
    reportsPerDay[day] = (reportsPerDay[day] || 0) + 1;
  }

  return {
    totalReports: reports.length,
    uniqueStudents: names.size,
    totalCorrect,
    totalChunks,
    avgScore: totalChunks > 0 ? (totalCorrect / totalChunks) * 100 : 0,
    globalRoleErrors,
    levelDistribution,
    reportsPerDay,
    studentNames: [...names].sort(),
  };
}
