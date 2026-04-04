/**
 * mergeHistory.ts — Persistence and undo logic for merge/rename actions.
 *
 * Stores a history of rename/merge actions in localStorage so that
 * teachers can undo accidental renames. Undo reverses the local rename
 * in reports + aliases and attempts a best-effort Drive update.
 */

import { renameKlas, renameStudent } from './sessionReport';
import { clearKlasAlias, clearStudentAlias } from './nameAliases';
import { getScriptUrl, renameKlasOnDrive, renameStudentOnDrive } from './googleDriveSync';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MergeAction {
  id: string;
  type: 'rename_klas' | 'merge_klas' | 'rename_student';
  oldValue: string;
  newValue: string;
  timestamp: string;
  undone: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'zinsontleding_merge_history_v1';
const MAX_ACTIONS = 50;

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `merge-${ts}-${rand}`;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function getMergeHistory(): MergeAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMergeHistory(history: MergeAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage may be unavailable
  }
}

// ---------------------------------------------------------------------------
// Add action
// ---------------------------------------------------------------------------

export function addMergeAction(
  action: Pick<MergeAction, 'type' | 'oldValue' | 'newValue'>,
): MergeAction {
  const history = getMergeHistory();
  const entry: MergeAction = {
    id: generateId(),
    type: action.type,
    oldValue: action.oldValue,
    newValue: action.newValue,
    timestamp: new Date().toISOString(),
    undone: false,
  };
  history.push(entry);
  // Trim oldest entries if over max
  if (history.length > MAX_ACTIONS) {
    history.splice(0, history.length - MAX_ACTIONS);
  }
  saveMergeHistory(history);
  return entry;
}

// ---------------------------------------------------------------------------
// Undo action
// ---------------------------------------------------------------------------

export function undoMergeAction(id: string): MergeAction | null {
  const history = getMergeHistory();
  const action = history.find(a => a.id === id);
  if (!action || action.undone) return null;

  // Reverse the rename
  switch (action.type) {
    case 'rename_klas':
    case 'merge_klas':
      // Rename back: newValue → oldValue
      renameKlas(action.newValue, action.oldValue);
      clearKlasAlias(action.oldValue);
      // Best-effort Drive update
      if (getScriptUrl()) {
        renameKlasOnDrive(action.newValue, action.oldValue).catch(() => {});
      }
      break;
    case 'rename_student':
      renameStudent(action.newValue, action.oldValue);
      clearStudentAlias(action.oldValue);
      if (getScriptUrl()) {
        renameStudentOnDrive(action.newValue, action.oldValue).catch(() => {});
      }
      break;
  }

  action.undone = true;
  saveMergeHistory(history);
  return action;
}

// ---------------------------------------------------------------------------
// Clear history
// ---------------------------------------------------------------------------

export function clearMergeHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
