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
  | 'check'
  | 'hint'
  | 'show_answer'
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
}

const STORAGE_KEY = 'zinsontleding_interactions_v1';
const MAX_ENTRIES = 2000;

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
  log.push({
    timestamp: new Date().toISOString(),
    type,
    sentenceId,
    detail,
  });
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
