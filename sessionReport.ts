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
  /** Student first name */
  name: string;
  /** First letter of last name (uppercase, optional) */
  initiaal?: string;
  /** Class name, normalised to lowercase (e.g. "1ga", "2hv3") */
  klas?: string;
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
  initiaal?: string,
  klas?: string,
): SessionReport {
  // Only include non-zero errors
  const err: Record<string, number> = {};
  for (const [k, v] of Object.entries(mistakeStats)) {
    if (v > 0) err[k] = v;
  }
  const report: SessionReport = {
    v: 1,
    name,
    ts: new Date().toISOString(),
    c: correct,
    t: total,
    lvl: level,
    err,
    sids: sentenceIds,
  };
  if (initiaal) report.initiaal = initiaal.toUpperCase();
  if (klas) report.klas = klas.toLowerCase().trim();
  return report;
}

// --- Aggregate statistics from imported reports ---

export interface KlasStats {
  klas: string;
  reportCount: number;
  uniqueStudents: number;
  avgScore: number;
}

export interface JaarlaagStats {
  /** First digit of class name, e.g. '1', '2', '3' — or '?' for unknown */
  jaarlaag: string;
  reportCount: number;
  uniqueStudents: number;
  uniqueKlassen: number;
  avgScore: number;
  /** Top role errors for this year group */
  topRoleErrors: Array<{ role: string; count: number }>;
}

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
  /** Normalised class names (lowercase) */
  klassen: string[];
  klasStats: KlasStats[];
  /** Stats grouped by year (first digit of class name) */
  jaarlaagStats: JaarlaagStats[];
}

/** Normalise class name: trim + lowercase */
export function normaliseKlas(klas: string): string {
  return klas.trim().toLowerCase();
}

/** Extract year group (jaarlaag) from class name: first digit, or '?' */
export function extractJaarlaag(klas: string): string {
  const match = klas.trim().match(/^(\d)/);
  return match ? match[1] : '?';
}

export function computeAggregateStats(
  reports: SessionReport[],
  filterKlas?: string,
  filterStudent?: string,
): AggregateStats {
  const normFilterKlas = filterKlas ? normaliseKlas(filterKlas) : null;
  const normFilterStudent = filterStudent ? filterStudent.trim().toLowerCase() : null;

  const filtered = reports.filter(r => {
    if (normFilterKlas && normaliseKlas(r.klas ?? '') !== normFilterKlas) return false;
    if (normFilterStudent && !r.name.trim().toLowerCase().includes(normFilterStudent)) return false;
    return true;
  });

  const names = new Set<string>();
  let totalCorrect = 0;
  let totalChunks = 0;
  const globalRoleErrors: Record<string, number> = {};
  const levelDistribution: Record<number, number> = {};
  const reportsPerDay: Record<string, number> = {};

  // Collect all classes
  const klassenSet = new Set<string>();
  for (const r of reports) {
    if (r.klas) klassenSet.add(normaliseKlas(r.klas));
  }

  for (const r of filtered) {
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

  // Compute per-class stats (always from all reports, unfiltered)
  const klasStatsMap = new Map<string, { count: number; students: Set<string>; totalC: number; totalT: number }>();
  for (const r of reports) {
    const klas = r.klas ? normaliseKlas(r.klas) : '(onbekend)';
    if (!klasStatsMap.has(klas)) klasStatsMap.set(klas, { count: 0, students: new Set(), totalC: 0, totalT: 0 });
    const entry = klasStatsMap.get(klas)!;
    entry.count += 1;
    if (r.name.trim()) entry.students.add(r.name.trim().toLowerCase());
    entry.totalC += r.c;
    entry.totalT += r.t;
  }

  const klasStats: KlasStats[] = [...klasStatsMap.entries()]
    .map(([klas, s]) => ({
      klas,
      reportCount: s.count,
      uniqueStudents: s.students.size,
      avgScore: s.totalT > 0 ? (s.totalC / s.totalT) * 100 : 0,
    }))
    .sort((a, b) => a.klas.localeCompare(b.klas));

  // Compute per-jaarlaag stats (always from all reports, unfiltered)
  const jaarlaagMap = new Map<string, {
    count: number;
    students: Set<string>;
    klassen: Set<string>;
    totalC: number;
    totalT: number;
    roleErrors: Record<string, number>;
  }>();
  for (const r of reports) {
    const jl = r.klas ? extractJaarlaag(r.klas) : '?';
    if (!jaarlaagMap.has(jl)) jaarlaagMap.set(jl, { count: 0, students: new Set(), klassen: new Set(), totalC: 0, totalT: 0, roleErrors: {} });
    const entry = jaarlaagMap.get(jl)!;
    entry.count += 1;
    if (r.name.trim()) entry.students.add(r.name.trim().toLowerCase());
    if (r.klas) entry.klassen.add(normaliseKlas(r.klas));
    entry.totalC += r.c;
    entry.totalT += r.t;
    for (const [role, count] of Object.entries(r.err)) {
      entry.roleErrors[role] = (entry.roleErrors[role] || 0) + count;
    }
  }

  const jaarlaagStats: JaarlaagStats[] = [...jaarlaagMap.entries()]
    .map(([jaarlaag, s]) => ({
      jaarlaag,
      reportCount: s.count,
      uniqueStudents: s.students.size,
      uniqueKlassen: s.klassen.size,
      avgScore: s.totalT > 0 ? (s.totalC / s.totalT) * 100 : 0,
      topRoleErrors: Object.entries(s.roleErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([role, count]) => ({ role, count })),
    }))
    .sort((a, b) => a.jaarlaag.localeCompare(b.jaarlaag));

  return {
    totalReports: filtered.length,
    uniqueStudents: names.size,
    totalCorrect,
    totalChunks,
    avgScore: totalChunks > 0 ? (totalCorrect / totalChunks) * 100 : 0,
    globalRoleErrors,
    levelDistribution,
    reportsPerDay,
    studentNames: [...names].sort(),
    klassen: [...klassenSet].sort(),
    klasStats,
    jaarlaagStats,
  };
}
