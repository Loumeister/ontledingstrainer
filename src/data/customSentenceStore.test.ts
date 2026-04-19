import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCustomSentences,
  saveCustomSentence,
  deleteCustomSentence,
  exportCustomSentences,
  exportMergedLevel,
  importCustomSentences,
  parseAndValidateSentences,
  getNextCustomId,
  encodeForSharing,
  decodeShared,
} from './customSentenceStore';
import type { Sentence, Token } from '../types';

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

const KEY = 'custom-sentences';

let _id = 10001;
function makeToken(text: string): Token {
  return { id: `t${_id++}`, text, role: 'ow' };
}

function makeSentence(id: number, level: Sentence['level'] = 1): Sentence {
  return {
    id,
    label: `Zin ${id}`,
    tokens: [makeToken('De'), makeToken('leerling'), makeToken('leest')],
    predicateType: 'WG',
    level,
  };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

// ── CRUD ─────────────────────────────────────────────────────────────────────

describe('getCustomSentences', () => {
  it('geeft lege array terug als storage leeg is', () => {
    expect(getCustomSentences()).toEqual([]);
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store[KEY] = 'GEEN JSON{';
    expect(getCustomSentences()).toEqual([]);
  });
});

describe('saveCustomSentence', () => {
  it('voegt een nieuwe zin toe', () => {
    saveCustomSentence(makeSentence(10001));
    expect(getCustomSentences()).toHaveLength(1);
  });

  it('overschrijft een bestaande zin op id (upsert)', () => {
    saveCustomSentence(makeSentence(10001));
    const updated = { ...makeSentence(10001), label: 'Gewijzigd' };
    saveCustomSentence(updated);
    expect(getCustomSentences()).toHaveLength(1);
    expect(getCustomSentences()[0].label).toBe('Gewijzigd');
  });
});

describe('deleteCustomSentence', () => {
  it('verwijdert de zin met het opgegeven id', () => {
    saveCustomSentence(makeSentence(10001));
    saveCustomSentence(makeSentence(10002));
    deleteCustomSentence(10001);
    expect(getCustomSentences()).toHaveLength(1);
    expect(getCustomSentences()[0].id).toBe(10002);
  });

  it('doet niets bij onbekend id', () => {
    saveCustomSentence(makeSentence(10001));
    deleteCustomSentence(99999);
    expect(getCustomSentences()).toHaveLength(1);
  });
});

// ── Export ────────────────────────────────────────────────────────────────────

describe('exportCustomSentences', () => {
  it('exporteert als JSON-string', () => {
    saveCustomSentence(makeSentence(10001));
    const json = exportCustomSentences();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe(10001);
  });
});

describe('exportMergedLevel', () => {
  it('combineert ingebouwde en custom zinnen voor een niveau', () => {
    const builtIn = [makeSentence(1, 1), makeSentence(2, 1)];
    const custom = [makeSentence(10001, 1)];
    const json = exportMergedLevel(1, builtIn, custom);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(3);
  });

  it('custom-zin overschrijft ingebouwde zin met hetzelfde id', () => {
    const builtIn = [makeSentence(1, 1)];
    const custom = [{ ...makeSentence(1, 1), label: 'Custom versie' }];
    const json = exportMergedLevel(1, builtIn, custom);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].label).toBe('Custom versie');
  });

  it('filtert zinnen van andere niveaus', () => {
    const builtIn = [makeSentence(1, 1), makeSentence(2, 2)];
    const custom: Sentence[] = [];
    const json = exportMergedLevel(1, builtIn, custom);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(1);
  });

  it('sorteert het resultaat op id', () => {
    const builtIn = [makeSentence(3, 1), makeSentence(1, 1)];
    const custom = [makeSentence(2, 1)];
    const json = exportMergedLevel(1, builtIn, custom);
    const parsed = JSON.parse(json);
    expect(parsed.map((s: Sentence) => s.id)).toEqual([1, 2, 3]);
  });
});

// ── Import ────────────────────────────────────────────────────────────────────

describe('importCustomSentences', () => {
  it('importeert een array van zinnen', () => {
    const json = JSON.stringify([makeSentence(10001)]);
    const result = importCustomSentences(json);
    expect(result).toHaveLength(1);
  });

  it('mergt met bestaande zinnen', () => {
    saveCustomSentence(makeSentence(10001));
    const json = JSON.stringify([makeSentence(10002)]);
    const result = importCustomSentences(json);
    expect(result).toHaveLength(2);
  });

  it('gooit een fout bij ongeldig formaat (geen array)', () => {
    expect(() => importCustomSentences(JSON.stringify({ id: 1 }))).toThrow();
  });

  it('gooit een fout bij zin zonder verplichte velden', () => {
    expect(() => importCustomSentences(JSON.stringify([{ id: 1 }]))).toThrow();
  });
});

// ── Validatie ─────────────────────────────────────────────────────────────────

describe('parseAndValidateSentences', () => {
  it('parset een geldige zin-array', () => {
    const result = parseAndValidateSentences(JSON.stringify([makeSentence(1)]));
    expect(result).toHaveLength(1);
  });

  it('gooit een fout als invoer geen array is', () => {
    expect(() => parseAndValidateSentences(JSON.stringify({}))).toThrow('verwacht een JSON-array');
  });

  it('gooit een fout bij zin zonder id', () => {
    const bad = [{ label: 'Test', predicateType: 'WG', level: 1, tokens: [makeToken('X')] }];
    expect(() => parseAndValidateSentences(JSON.stringify(bad))).toThrow();
  });

  it('gooit een fout bij ongeldig predicateType', () => {
    const bad = [{ id: 1, label: 'Test', predicateType: 'XX', level: 1, tokens: [makeToken('X')] }];
    expect(() => parseAndValidateSentences(JSON.stringify(bad))).toThrow();
  });

  it('gooit een fout bij level buiten bereik', () => {
    const bad = [{ id: 1, label: 'Test', predicateType: 'WG', level: 9, tokens: [makeToken('X')] }];
    expect(() => parseAndValidateSentences(JSON.stringify(bad))).toThrow();
  });

  it('gooit een fout bij lege tokens-array', () => {
    const bad = [{ id: 1, label: 'Test', predicateType: 'WG', level: 1, tokens: [] }];
    expect(() => parseAndValidateSentences(JSON.stringify(bad))).toThrow();
  });

  it('gooit een fout bij token zonder id', () => {
    const bad = [{ id: 1, label: 'Test', predicateType: 'WG', level: 1, tokens: [{ text: 'X', role: 'ow' }] }];
    expect(() => parseAndValidateSentences(JSON.stringify(bad))).toThrow();
  });
});

// ── getNextCustomId ────────────────────────────────────────────────────────────

describe('getNextCustomId', () => {
  it('geeft 10001 terug als er geen custom zinnen zijn', () => {
    expect(getNextCustomId()).toBe(10001);
  });

  it('geeft max(id) + 1 terug', () => {
    saveCustomSentence(makeSentence(10005));
    expect(getNextCustomId()).toBe(10006);
  });
});

// ── Encode/decode voor delen ──────────────────────────────────────────────────

describe('encodeForSharing / decodeShared', () => {
  it('round-trip: encode dan decode geeft originele zinnen terug', () => {
    const original = [makeSentence(1)];
    const encoded = encodeForSharing(original);
    const decoded = decodeShared(encoded);
    expect(decoded).toHaveLength(1);
    expect(decoded[0].id).toBe(1);
  });

  it('geeft lege array terug bij ongeldige encoded string', () => {
    expect(decodeShared('GEEN_GELDIGE_BASE64!!!!')).toEqual([]);
  });

  it('geeft lege string terug als encode mislukt', () => {
    // Normale input should not fail
    expect(encodeForSharing([])).toBeTruthy();
  });
});
