import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAssignments,
  getAssignmentById,
  saveAssignment,
  createAssignment,
  bumpVersion,
  deleteAssignment,
  migrateFromCustomSentences,
  computeContentHash,
} from './trainerAssignmentStore';
import type { TrainerAssignment } from '../types';

// ── localStorage mock ──────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('computeContentHash', () => {
  it('returns a non-empty string', () => {
    expect(computeContentHash([1, 2, 3])).toBeTruthy();
  });

  it('is deterministic for same input', () => {
    expect(computeContentHash([3, 1, 2])).toBe(computeContentHash([1, 2, 3]));
  });

  it('differs for different inputs', () => {
    expect(computeContentHash([1, 2, 3])).not.toBe(computeContentHash([1, 2, 4]));
  });
});

describe('getAssignments', () => {
  it('returns empty array when store is empty', () => {
    expect(getAssignments()).toEqual([]);
  });

  it('returns corrupted JSON as empty array', () => {
    store['zinsontleding_assignments_v1'] = 'bad-json';
    expect(getAssignments()).toEqual([]);
  });
});

describe('createAssignment', () => {
  it('creates an assignment with version 1', () => {
    const a = createAssignment('Test opdracht', [1, 2, 3]);
    expect(a.version).toBe(1);
    expect(a.sentenceIds).toEqual([1, 2, 3]);
    expect(a.id).toMatch(/^asgn-/);
  });

  it('persists to localStorage', () => {
    createAssignment('Test', [10]);
    expect(getAssignments()).toHaveLength(1);
  });

  it('uses provided id when given', () => {
    const a = createAssignment('Custom id', [5], 'my-id');
    expect(a.id).toBe('my-id');
  });

  it('sets createdAt and updatedAt', () => {
    const a = createAssignment('Time test', [1]);
    expect(a.createdAt).toMatch(/^\d{4}-/);
    expect(a.updatedAt).toBe(a.createdAt);
  });
});

describe('saveAssignment (upsert)', () => {
  it('updates existing assignment in place', () => {
    const a = createAssignment('Original', [1]);
    const updated: TrainerAssignment = { ...a, title: 'Updated' };
    saveAssignment(updated);
    expect(getAssignments()).toHaveLength(1);
    expect(getAssignmentById(a.id)!.title).toBe('Updated');
  });

  it('inserts new assignment if id not found', () => {
    createAssignment('First', [1]);
    saveAssignment({
      id: 'new-id',
      title: 'Second',
      version: 1,
      contentHash: 'abc',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      sentenceIds: [2],
    });
    expect(getAssignments()).toHaveLength(2);
  });
});

describe('bumpVersion', () => {
  it('returns null for unknown id', () => {
    expect(bumpVersion('nonexistent', [1])).toBeNull();
  });

  it('increments version and updates sentenceIds', () => {
    const a = createAssignment('Versioned', [1, 2]);
    const bumped = bumpVersion(a.id, [1, 2, 3]);
    expect(bumped!.version).toBe(2);
    expect(bumped!.sentenceIds).toEqual([1, 2, 3]);
  });

  it('recomputes contentHash after bump', () => {
    const a = createAssignment('Hash test', [1]);
    const oldHash = a.contentHash;
    const bumped = bumpVersion(a.id, [1, 2]);
    expect(bumped!.contentHash).not.toBe(oldHash);
  });

  it('updates updatedAt but preserves createdAt', () => {
    const a = createAssignment('Time test', [1]);
    const createdAt = a.createdAt;
    const bumped = bumpVersion(a.id, [1, 2]);
    expect(bumped!.createdAt).toBe(createdAt);
  });

  it('persists the bumped version', () => {
    const a = createAssignment('Persist', [1]);
    bumpVersion(a.id, [1, 2]);
    expect(getAssignmentById(a.id)!.version).toBe(2);
  });
});

describe('deleteAssignment', () => {
  it('removes the assignment', () => {
    const a = createAssignment('To delete', [1]);
    deleteAssignment(a.id);
    expect(getAssignmentById(a.id)).toBeNull();
  });

  it('is a no-op for unknown id', () => {
    createAssignment('Keeper', [1]);
    deleteAssignment('unknown');
    expect(getAssignments()).toHaveLength(1);
  });
});

describe('migrateFromCustomSentences', () => {
  it('returns null when custom-sentences key is absent', () => {
    expect(migrateFromCustomSentences()).toBeNull();
  });

  it('returns null for empty sentence array', () => {
    store['custom-sentences'] = JSON.stringify([]);
    expect(migrateFromCustomSentences()).toBeNull();
  });

  it('creates a default assignment from custom sentences', () => {
    const sentences = [{ id: 10001 }, { id: 10002 }];
    store['custom-sentences'] = JSON.stringify(sentences);
    const a = migrateFromCustomSentences();
    expect(a).not.toBeNull();
    expect(a!.id).toBe('default');
    expect(a!.sentenceIds).toContain(10001);
    expect(a!.sentenceIds).toContain(10002);
  });

  it('is idempotent — does not create duplicates', () => {
    store['custom-sentences'] = JSON.stringify([{ id: 10001 }]);
    migrateFromCustomSentences();
    migrateFromCustomSentences();
    expect(getAssignments()).toHaveLength(1);
  });

  it('preserves existing default assignment', () => {
    store['custom-sentences'] = JSON.stringify([{ id: 10001 }]);
    const first = migrateFromCustomSentences()!;
    store['custom-sentences'] = JSON.stringify([{ id: 10002 }]);
    const second = migrateFromCustomSentences()!;
    expect(second.id).toBe(first.id);
    // sentenceIds not changed because 'default' already existed
    expect(second.sentenceIds).toContain(10001);
  });
});
