import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMergeHistory,
  addMergeAction,
  undoMergeAction,
  clearMergeHistory,
} from './mergeHistory';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  length: 0,
  key: vi.fn(() => null),
};

vi.stubGlobal('localStorage', localStorageMock);

// ---------------------------------------------------------------------------
// Mock external dependencies
// ---------------------------------------------------------------------------

vi.mock('./sessionReport', () => ({
  renameKlas: vi.fn(),
  renameStudent: vi.fn(),
}));

vi.mock('./nameAliases', () => ({
  setKlasAlias: vi.fn(),
  clearKlasAlias: vi.fn(),
  setStudentAlias: vi.fn(),
  clearStudentAlias: vi.fn(),
}));

vi.mock('./googleDriveSync', () => ({
  getScriptUrl: vi.fn(() => null),
  renameKlasOnDrive: vi.fn(() => Promise.resolve()),
  renameStudentOnDrive: vi.fn(() => Promise.resolve()),
}));

import { renameKlas, renameStudent } from './sessionReport';
import { setKlasAlias, clearKlasAlias, setStudentAlias, clearStudentAlias } from './nameAliases';
import { getScriptUrl, renameKlasOnDrive, renameStudentOnDrive } from './googleDriveSync';

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getMergeHistory
// ---------------------------------------------------------------------------

describe('getMergeHistory', () => {
  it('returns empty array when storage is empty', () => {
    expect(getMergeHistory()).toEqual([]);
  });

  it('returns parsed history from storage', () => {
    const entries = [{ id: 'x', type: 'rename_klas', oldValue: 'a', newValue: 'b', timestamp: 't', undone: false }];
    store['zinsontleding_merge_history_v1'] = JSON.stringify(entries);
    expect(getMergeHistory()).toEqual(entries);
  });

  it('returns empty array on invalid JSON', () => {
    store['zinsontleding_merge_history_v1'] = 'not-json{{{';
    expect(getMergeHistory()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// addMergeAction
// ---------------------------------------------------------------------------

describe('addMergeAction', () => {
  it('creates an entry with id, timestamp, and undone=false', () => {
    const result = addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    expect(result.type).toBe('rename_klas');
    expect(result.oldValue).toBe('1a');
    expect(result.newValue).toBe('1b');
    expect(result.undone).toBe(false);
    expect(result.id).toMatch(/^merge-/);
    expect(result.timestamp).toBeTruthy();
  });

  it('persists the entry to localStorage', () => {
    addMergeAction({ type: 'rename_student', oldValue: 'jan', newValue: 'jan b.' });
    const history = getMergeHistory();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('rename_student');
  });

  it('accumulates multiple entries', () => {
    addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    addMergeAction({ type: 'rename_klas', oldValue: '2a', newValue: '2b' });
    expect(getMergeHistory()).toHaveLength(2);
  });

  it('trims oldest entries when history exceeds 50', () => {
    for (let i = 0; i < 55; i++) {
      addMergeAction({ type: 'rename_klas', oldValue: `old${i}`, newValue: `new${i}` });
    }
    const history = getMergeHistory();
    expect(history).toHaveLength(50);
    // The oldest 5 should be gone; the most recent should survive
    expect(history[history.length - 1].oldValue).toBe('old54');
  });
});

// ---------------------------------------------------------------------------
// undoMergeAction — rename_klas / merge_klas
// ---------------------------------------------------------------------------

describe('undoMergeAction — rename_klas', () => {
  it('reverses the rename locally and sets reverse alias', () => {
    const entry = addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    undoMergeAction(entry.id);

    expect(renameKlas).toHaveBeenCalledWith('1b', '1a');
    expect(setKlasAlias).toHaveBeenCalledWith('1b', '1a');
    expect(clearKlasAlias).toHaveBeenCalledWith('1a');
  });

  it('marks the action as undone', () => {
    const entry = addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    undoMergeAction(entry.id);

    const history = getMergeHistory();
    expect(history.find(a => a.id === entry.id)?.undone).toBe(true);
  });

  it('returns the action on success', () => {
    const entry = addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    const result = undoMergeAction(entry.id);
    expect(result?.id).toBe(entry.id);
  });

  it('returns null for unknown id', () => {
    expect(undoMergeAction('does-not-exist')).toBeNull();
  });

  it('returns null if already undone', () => {
    const entry = addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    undoMergeAction(entry.id);
    vi.clearAllMocks();

    const secondAttempt = undoMergeAction(entry.id);
    expect(secondAttempt).toBeNull();
    expect(renameKlas).not.toHaveBeenCalled();
  });

  it('does not call Drive when getScriptUrl is null', () => {
    vi.mocked(getScriptUrl).mockReturnValue(null);
    const entry = addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    undoMergeAction(entry.id);
    expect(renameKlasOnDrive).not.toHaveBeenCalled();
  });

  it('calls Drive rename when script URL is set', () => {
    vi.mocked(getScriptUrl).mockReturnValue('https://script.google.com/abc');
    const entry = addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    undoMergeAction(entry.id);
    expect(renameKlasOnDrive).toHaveBeenCalledWith('1b', '1a');
  });
});

// ---------------------------------------------------------------------------
// undoMergeAction — rename_student
// ---------------------------------------------------------------------------

describe('undoMergeAction — rename_student', () => {
  it('reverses the rename and sets reverse alias', () => {
    const entry = addMergeAction({ type: 'rename_student', oldValue: 'jan', newValue: 'jan b.' });
    undoMergeAction(entry.id);

    expect(renameStudent).toHaveBeenCalledWith('jan b.', 'jan');
    expect(setStudentAlias).toHaveBeenCalledWith('jan b.', 'jan');
    expect(clearStudentAlias).toHaveBeenCalledWith('jan');
  });

  it('does not call Drive when script URL is null', () => {
    vi.mocked(getScriptUrl).mockReturnValue(null);
    const entry = addMergeAction({ type: 'rename_student', oldValue: 'jan', newValue: 'jan b.' });
    undoMergeAction(entry.id);
    expect(renameStudentOnDrive).not.toHaveBeenCalled();
  });

  it('calls Drive rename when script URL is set', () => {
    vi.mocked(getScriptUrl).mockReturnValue('https://script.google.com/abc');
    const entry = addMergeAction({ type: 'rename_student', oldValue: 'jan', newValue: 'jan b.' });
    undoMergeAction(entry.id);
    expect(renameStudentOnDrive).toHaveBeenCalledWith('jan b.', 'jan');
  });
});

// ---------------------------------------------------------------------------
// clearMergeHistory
// ---------------------------------------------------------------------------

describe('clearMergeHistory', () => {
  it('empties the history', () => {
    addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    clearMergeHistory();
    expect(getMergeHistory()).toEqual([]);
  });

  it('removes the localStorage key', () => {
    addMergeAction({ type: 'rename_klas', oldValue: '1a', newValue: '1b' });
    clearMergeHistory();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('zinsontleding_merge_history_v1');
  });
});
