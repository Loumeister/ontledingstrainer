import { SessionHistoryEntry } from './types';

const STORAGE_KEY = 'zinsontleding_session_history_v1';
const MAX_ENTRIES = 20;

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

export function saveSessionToHistory(entry: SessionHistoryEntry): void {
  const history = loadSessionHistory();
  history.push(entry);
  if (history.length > MAX_ENTRIES) {
    history.splice(0, history.length - MAX_ENTRIES);
  }
  saveSessionHistory(history);
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
