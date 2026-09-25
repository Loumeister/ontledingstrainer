import { SessionHistoryEntry } from '../types';

const STORAGE_KEY = 'zinsontleding_session_history_v1';
/** Per leerling (studentId); sessies zonder studentId delen één eigen bak. */
const MAX_ENTRIES_PER_STUDENT = 20;
/** Opslaggrens voor de hele browser (gedeelde laptops met meerdere klassen). */
const MAX_ENTRIES_TOTAL = 400;

export function loadSessionHistory(): SessionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessionHistory(history: SessionHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage may be unavailable
  }
}

const bucketOf = (e: SessionHistoryEntry): string => e.studentId ?? '';

/**
 * Snoei per leerling in plaats van browserbreed: anders drukken sessies van
 * de ene leerling op een gedeelde laptop de geschiedenis van een andere
 * leerling uit de adaptieve selectie. Boven de totaalgrens valt eerst de
 * leerling af die het langst niet heeft geoefend. Volgorde blijft oud → nieuw.
 */
export function trimSessionHistory(history: SessionHistoryEntry[]): SessionHistoryEntry[] {
  const perBucket = new Map<string, number>();
  const kept: SessionHistoryEntry[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const b = bucketOf(history[i]);
    const n = perBucket.get(b) ?? 0;
    if (n >= MAX_ENTRIES_PER_STUDENT) continue;
    perBucket.set(b, n + 1);
    kept.push(history[i]);
  }
  kept.reverse();

  let excess = kept.length - MAX_ENTRIES_TOTAL;
  if (excess <= 0) return kept;

  // Laatste positie per bak = laatste activiteit; minst recent actief eerst.
  const lastIndex = new Map<string, number>();
  kept.forEach((e, i) => lastIndex.set(bucketOf(e), i));
  const removeCount = new Map<string, number>();
  for (const [b] of [...lastIndex].sort((x, y) => x[1] - y[1])) {
    if (excess <= 0) break;
    const take = Math.min(excess, perBucket.get(b) ?? 0);
    removeCount.set(b, take);
    excess -= take;
  }
  return kept.filter(e => {
    const b = bucketOf(e);
    const left = removeCount.get(b) ?? 0;
    if (left <= 0) return true;
    removeCount.set(b, left - 1); // oudste sessies van die bak eerst
    return false;
  });
}

export function saveSessionToHistory(entry: SessionHistoryEntry): void {
  const history = loadSessionHistory();
  history.push(entry);
  saveSessionHistory(trimSessionHistory(history));
}

/**
 * Calculate streak: number of consecutive days (including today) with at least one session.
 */
export function getStreak(): number {
  const history = loadSessionHistory();
  if (history.length === 0) return 0;

  // Get unique dates (YYYY-MM-DD), most recent first
  const uniqueDates = [...new Set(
    history.map(e => e.date.slice(0, 10))
  )].sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  // If the most recent session isn't today or yesterday, streak is 0
  const mostRecent = uniqueDates[0];
  const diffFromToday = daysDiff(mostRecent, today);
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = daysDiff(uniqueDates[i], uniqueDates[i - 1]);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function daysDiff(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get the previous session's score percentage (or null if no previous session).
 */
export function getPreviousScore(): number | null {
  const history = loadSessionHistory();
  // The current session hasn't been saved yet when this is called,
  // so the last entry in history is the previous session
  if (history.length === 0) return null;
  return history[history.length - 1].scorePercentage;
}

// --- Persoonlijk Record ---

const PR_KEY = 'zinsontleding_pr_v1';

export function getPersonalRecord(): number {
  try {
    const raw = localStorage.getItem(PR_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/** Updates PR if score is higher. Returns true if a new record was set. */
export function updatePersonalRecord(score: number): boolean {
  const current = getPersonalRecord();
  if (score > current) {
    try { localStorage.setItem(PR_KEY, String(score)); } catch { /* ignore */ }
    return true;
  }
  return false;
}

// --- Consistentiestreak: opeenvolgende sessies boven drempel ---

/**
 * Returns the number of consecutive recent sessions (including the last one)
 * that scored >= threshold. The history should already include the current session.
 */
export function getConsistencyStreak(history: SessionHistoryEntry[], threshold: number): number {
  if (history.length === 0) return 0;
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].scorePercentage >= threshold) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// --- Vlekkeloos-teller (perfecte sessies: 100%) ---

const PERFECT_KEY = 'zinsontleding_perfect_count_v1';

export function getPerfectSessionCount(): number {
  try {
    const raw = localStorage.getItem(PERFECT_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/** Increments the counter and returns the new count. */
export function incrementPerfectSessionCount(): number {
  const next = getPerfectSessionCount() + 1;
  try { localStorage.setItem(PERFECT_KEY, String(next)); } catch { /* ignore */ }
  return next;
}
