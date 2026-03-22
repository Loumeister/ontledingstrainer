export type InteractionType =
  | 'session_start'
  | 'sentence_start'
  | 'split_toggle'
  | 'step_forward'
  | 'step_back'
  | 'label_drop'
  | 'label_remove'
  | 'sub_label_drop'
  | 'sub_label_remove'
  | 'bijzin_functie_drop'
  | 'bijzin_functie_remove'
  | 'bijvbep_link'
  | 'bijvbep_unlink'
  | 'word_bijvbep_link'
  | 'check'
  | 'hint'
  | 'show_answer'
  | 'retry'
  | 'session_finish'
  | 'abort'
  | 'error_split'
  | 'error_role'
  | 'error_bijzin_functie';

export interface InteractionEntry {
  timestamp: string;
  type: InteractionType;
  sentenceId?: number;
  detail?: string;
  userName?: string;
}

const STORAGE_KEY = 'zinsontleding_interactions_v1';
const STUDENT_INFO_KEY = 'student_info_v1';
const MAX_ENTRIES = 2000;

/**
 * Read the current student display name from localStorage (set on HomeScreen).
 * Returns undefined when no name is stored yet.
 */
function getCurrentUserName(): string | undefined {
  try {
    const raw = localStorage.getItem(STUDENT_INFO_KEY);
    if (!raw) return undefined;
    const { name, initiaal } = JSON.parse(raw) as { name?: string; initiaal?: string };
    if (!name) return undefined;
    const trimmed = name.trim();
    if (!trimmed) return undefined;
    return initiaal ? `${trimmed} ${initiaal.toUpperCase()}.` : trimmed;
  } catch {
    return undefined;
  }
}

/**
 * Load interaction log from localStorage.
 */
export function loadInteractionLog(): InteractionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save interaction log to localStorage.
 */
export function saveInteractionLog(log: InteractionEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Append one interaction entry. Trims log to MAX_ENTRIES if needed.
 */
export function logInteraction(
  type: InteractionType,
  sentenceId?: number,
  detail?: string,
): void {
  const log = loadInteractionLog();
  const entry: InteractionEntry = {
    timestamp: new Date().toISOString(),
    type,
    sentenceId,
    detail,
  };
  const userName = getCurrentUserName();
  if (userName) entry.userName = userName;
  log.push(entry);
  // Trim from front if over max
  if (log.length > MAX_ENTRIES) {
    log.splice(0, log.length - MAX_ENTRIES);
  }
  saveInteractionLog(log);
}

/**
 * Clear all interaction data.
 */
export function clearInteractionLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export interaction log as JSON download.
 */
export function exportInteractionLogAsJson(): void {
  const log = loadInteractionLog();
  const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zinsontleding_interactions_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Compute clickthrough summary statistics from the interaction log.
 */
export function computeClickthroughStats(log: InteractionEntry[]): {
  totalSessions: number;
  totalSentencesStarted: number;
  totalChecks: number;
  totalHints: number;
  totalShowAnswers: number;
  totalSplitErrors: number;
  totalRoleErrors: number;
  totalBijzinFunctieErrors: number;
  avgActionsPerSentence: number;
} {
  let totalSessions = 0;
  let totalSentencesStarted = 0;
  let totalChecks = 0;
  let totalHints = 0;
  let totalShowAnswers = 0;
  let totalSplitErrors = 0;
  let totalRoleErrors = 0;
  let totalBijzinFunctieErrors = 0;
  let totalActions = 0;

  for (const entry of log) {
    switch (entry.type) {
      case 'session_start': totalSessions++; break;
      case 'sentence_start': totalSentencesStarted++; break;
      case 'check': totalChecks++; break;
      case 'hint': totalHints++; break;
      case 'show_answer': totalShowAnswers++; break;
      case 'error_split': totalSplitErrors++; break;
      case 'error_role': totalRoleErrors++; break;
      case 'error_bijzin_functie': totalBijzinFunctieErrors++; break;
    }
    totalActions++;
  }

  return {
    totalSessions,
    totalSentencesStarted,
    totalChecks,
    totalHints,
    totalShowAnswers,
    totalSplitErrors,
    totalRoleErrors,
    totalBijzinFunctieErrors,
    avgActionsPerSentence: totalSentencesStarted > 0 ? totalActions / totalSentencesStarted : 0,
  };
}

/**
 * Compute owner-level session statistics from the interaction log.
 */
export interface SessionFlowStats {
  sessionsStarted: number;
  sessionsFinished: number;
  sessionsAborted: number;
  completionRate: number;
  avgSessionDurationSec: number | null;
  activeDays: string[];
  activityPerDay: Record<string, number>;
}

export function computeSessionFlowStats(log: InteractionEntry[]): SessionFlowStats {
  let sessionsStarted = 0;
  let sessionsFinished = 0;
  let sessionsAborted = 0;
  let currentSessionStart: string | null = null;
  let totalDurationMs = 0;
  let completedWithDuration = 0;
  const daySet = new Set<string>();
  const activityPerDay: Record<string, number> = {};

  for (const entry of log) {
    // Track active days from all events
    const day = entry.timestamp.slice(0, 10);
    if (day) {
      daySet.add(day);
      activityPerDay[day] = (activityPerDay[day] || 0) + 1;
    }

    switch (entry.type) {
      case 'session_start':
        sessionsStarted++;
        currentSessionStart = entry.timestamp;
        break;
      case 'session_finish':
        sessionsFinished++;
        if (currentSessionStart) {
          const durationMs = new Date(entry.timestamp).getTime() - new Date(currentSessionStart).getTime();
          if (durationMs > 0) {
            totalDurationMs += durationMs;
            completedWithDuration++;
          }
        }
        currentSessionStart = null;
        break;
      case 'abort':
        sessionsAborted++;
        currentSessionStart = null;
        break;
    }
  }

  return {
    sessionsStarted,
    sessionsFinished,
    sessionsAborted,
    completionRate: sessionsStarted > 0 ? (sessionsFinished / sessionsStarted) * 100 : 0,
    avgSessionDurationSec: completedWithDuration > 0 ? (totalDurationMs / completedWithDuration) / 1000 : null,
    activeDays: [...daySet].sort(),
    activityPerDay,
  };
}

/**
 * Per-user statistics derived from the interaction log.
 */
export interface UserStats {
  userName: string;
  sessions: number;
  sentencesStarted: number;
  checks: number;
  hints: number;
  showAnswers: number;
  splitErrors: number;
  roleErrors: number;
  lastActive: string;
}

/**
 * Compute per-user statistics from the interaction log.
 * Only entries that have a `userName` are counted.
 */
export function computePerUserStats(log: InteractionEntry[]): UserStats[] {
  const map = new Map<string, UserStats>();

  for (const entry of log) {
    if (!entry.userName) continue;
    const name = entry.userName;

    let stats = map.get(name);
    if (!stats) {
      stats = {
        userName: name,
        sessions: 0,
        sentencesStarted: 0,
        checks: 0,
        hints: 0,
        showAnswers: 0,
        splitErrors: 0,
        roleErrors: 0,
        lastActive: '',
      };
      map.set(name, stats);
    }

    if (!stats.lastActive || entry.timestamp > stats.lastActive) {
      stats.lastActive = entry.timestamp;
    }

    switch (entry.type) {
      case 'session_start': stats.sessions++; break;
      case 'sentence_start': stats.sentencesStarted++; break;
      case 'check': stats.checks++; break;
      case 'hint': stats.hints++; break;
      case 'show_answer': stats.showAnswers++; break;
      case 'error_split': stats.splitErrors++; break;
      case 'error_role': stats.roleErrors++; break;
    }
  }

  return [...map.values()].sort((a, b) => b.lastActive.localeCompare(a.lastActive));
}
