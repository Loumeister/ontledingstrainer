import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Sentence } from '../types';
import {
  getCustomSentences,
  saveCustomSentence,
  deleteCustomSentence,
  exportCustomSentences,
  importCustomSentences,
  getNextCustomId,
  encodeForSharing,
  decodeShared,
  buildShareUrl,
} from './customSentenceStore';

// ─── localStorage mock ───────────────────────────────────────────────────────

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMinimalSentence(overrides: Partial<Sentence> & { id: number }): Sentence {
  return {
    label: 'Testzin',
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: 't1', text: 'De', role: 'ow' },
      { id: 't2', text: 'kat', role: 'ow' },
      { id: 't3', text: 'slaapt', role: 'pv' },
    ],
    ...overrides,
  };
}

// ─── getCustomSentences ───────────────────────────────────────────────────────

describe('getCustomSentences', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getCustomSentences()).toEqual([]);
  });

  it('returns parsed sentences from localStorage', () => {
    const sentences = [makeMinimalSentence({ id: 10001 })];
    store['custom-sentences'] = JSON.stringify(sentences);
    expect(getCustomSentences()).toEqual(sentences);
  });

  it('returns empty array when localStorage contains invalid JSON', () => {
    store['custom-sentences'] = 'not-valid-json{{{';
    expect(getCustomSentences()).toEqual([]);
  });
});

// ─── saveCustomSentence ───────────────────────────────────────────────────────

describe('saveCustomSentence', () => {
  it('appends a new sentence', () => {
    const s = makeMinimalSentence({ id: 10001 });
    saveCustomSentence(s);
    expect(getCustomSentences()).toHaveLength(1);
    expect(getCustomSentences()[0].id).toBe(10001);
  });

  it('updates an existing sentence by id', () => {
    const original = makeMinimalSentence({ id: 10001, label: 'Oud label' });
    saveCustomSentence(original);
    const updated = makeMinimalSentence({ id: 10001, label: 'Nieuw label' });
    saveCustomSentence(updated);
    const all = getCustomSentences();
    expect(all).toHaveLength(1);
    expect(all[0].label).toBe('Nieuw label');
  });

  it('saves multiple distinct sentences', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10001 }));
    saveCustomSentence(makeMinimalSentence({ id: 10002 }));
    expect(getCustomSentences()).toHaveLength(2);
  });
});

// ─── deleteCustomSentence ─────────────────────────────────────────────────────

describe('deleteCustomSentence', () => {
  it('removes a sentence by id', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10001 }));
    saveCustomSentence(makeMinimalSentence({ id: 10002 }));
    deleteCustomSentence(10001);
    const all = getCustomSentences();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(10002);
  });

  it('is a no-op when id does not exist', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10001 }));
    deleteCustomSentence(99999);
    expect(getCustomSentences()).toHaveLength(1);
  });

  it('results in empty store when last sentence is deleted', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10001 }));
    deleteCustomSentence(10001);
    expect(getCustomSentences()).toEqual([]);
  });
});

// ─── exportCustomSentences ────────────────────────────────────────────────────

describe('exportCustomSentences', () => {
  it('returns a valid JSON string of all stored sentences', () => {
    const s = makeMinimalSentence({ id: 10001 });
    saveCustomSentence(s);
    const json = exportCustomSentences();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe(10001);
  });

  it('returns an empty array JSON when there are no sentences', () => {
    expect(exportCustomSentences()).toBe('[]');
  });
});

// ─── importCustomSentences ────────────────────────────────────────────────────

describe('importCustomSentences', () => {
  it('imports valid sentences and merges with existing', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10001 }));
    const incoming = [makeMinimalSentence({ id: 10002 })];
    const result = importCustomSentences(JSON.stringify(incoming));
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toContain(10001);
    expect(result.map(s => s.id)).toContain(10002);
  });

  it('overwrites existing sentence when id matches', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10001, label: 'Oud' }));
    const updated = [makeMinimalSentence({ id: 10001, label: 'Bijgewerkt' })];
    const result = importCustomSentences(JSON.stringify(updated));
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Bijgewerkt');
  });

  it('throws when the input is not an array', () => {
    expect(() => importCustomSentences(JSON.stringify({ id: 1 }))).toThrow('Ongeldig formaat');
  });

  it('throws when a sentence is missing required field: id', () => {
    const bad = [{ label: 'Zonder ID', tokens: [], predicateType: 'WG', level: 1 }];
    expect(() => importCustomSentences(JSON.stringify(bad))).toThrow('Ongeldige zin');
  });

  it('throws when a sentence is missing required field: tokens', () => {
    const bad = [{ id: 1, label: 'Zonder tokens', predicateType: 'WG', level: 1 }];
    expect(() => importCustomSentences(JSON.stringify(bad))).toThrow('Ongeldige zin');
  });

  it('throws when a sentence is missing required field: predicateType', () => {
    const bad = [{ id: 1, label: 'Test', tokens: [], level: 1 }];
    expect(() => importCustomSentences(JSON.stringify(bad))).toThrow('Ongeldige zin');
  });

  it('throws when input is completely invalid JSON', () => {
    expect(() => importCustomSentences('{ not json }')).toThrow();
  });
});

// ─── getNextCustomId ──────────────────────────────────────────────────────────

describe('getNextCustomId', () => {
  it('returns 10001 when there are no existing sentences', () => {
    expect(getNextCustomId()).toBe(10001);
  });

  it('returns one more than the current maximum id', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10003 }));
    saveCustomSentence(makeMinimalSentence({ id: 10001 }));
    expect(getNextCustomId()).toBe(10004);
  });

  it('handles a single sentence with the base ID', () => {
    saveCustomSentence(makeMinimalSentence({ id: 10000 }));
    expect(getNextCustomId()).toBe(10001);
  });
});

// ─── encodeForSharing / decodeShared ─────────────────────────────────────────

describe('encodeForSharing / decodeShared round-trip', () => {
  it('encodes and decodes a single sentence faithfully', () => {
    const sentences = [makeMinimalSentence({ id: 10001 })];
    const encoded = encodeForSharing(sentences);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodeShared(encoded);
    expect(decoded).toEqual(sentences);
  });

  it('encodes and decodes multiple sentences', () => {
    const sentences = [
      makeMinimalSentence({ id: 10001, label: 'Eerste' }),
      makeMinimalSentence({ id: 10002, label: 'Tweede' }),
    ];
    const encoded = encodeForSharing(sentences);
    expect(decodeShared(encoded)).toEqual(sentences);
  });

  it('produces URL-safe characters (no +, /, or =)', () => {
    const sentences = [makeMinimalSentence({ id: 10001 })];
    const encoded = encodeForSharing(sentences);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('decodeShared returns empty array for invalid input', () => {
    expect(decodeShared('!!!invalid base64!!!')).toEqual([]);
  });

  it('decodeShared returns empty array for empty string', () => {
    expect(decodeShared('')).toEqual([]);
  });

  it('encodeForSharing returns empty string on unencodable input', () => {
    // Simulate an object that would cause JSON.stringify to throw
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    // Cast to Sentence[] so TypeScript is satisfied – we're testing error handling
    expect(encodeForSharing(circular as unknown as Sentence[])).toBe('');
  });
});

// ─── buildShareUrl ────────────────────────────────────────────────────────────

describe('buildShareUrl', () => {
  it('includes the encoded sentences in the query string', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://example.com', pathname: '/ontledingstrainer/' },
    });
    const sentences = [makeMinimalSentence({ id: 10001 })];
    const url = buildShareUrl(sentences);
    expect(url).toMatch(/^https:\/\/example\.com\/ontledingstrainer\/\?zinnen=/);
    // The value after ?zinnen= should decode back to the original sentences
    const encoded = new URL(url).searchParams.get('zinnen');
    expect(decodeShared(encoded!)).toEqual(sentences);
  });
});
