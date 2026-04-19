import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFeedbackOverrides,
  setFeedbackOverride,
  resetFeedbackOverride,
  clearAllFeedbackOverrides,
  exportFeedbackOverrides,
} from './feedbackOverrides';

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

const KEY = 'feedbackOverrides';

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('getFeedbackOverrides', () => {
  it('geeft leeg object terug als storage leeg is', () => {
    expect(getFeedbackOverrides()).toEqual({});
  });

  it('geeft opgeslagen overrides terug', () => {
    store[KEY] = JSON.stringify({ ow: { pv: 'aangepaste tekst' } });
    expect(getFeedbackOverrides()).toEqual({ ow: { pv: 'aangepaste tekst' } });
  });

  it('geeft leeg object terug bij ongeldig JSON', () => {
    store[KEY] = 'GEEN JSON{';
    expect(getFeedbackOverrides()).toEqual({});
  });
});

describe('setFeedbackOverride', () => {
  it('slaat een nieuwe override op', () => {
    setFeedbackOverride('ow', 'pv', 'nieuw');
    expect(getFeedbackOverrides()).toEqual({ ow: { pv: 'nieuw' } });
  });

  it('overschrijft een bestaande override', () => {
    setFeedbackOverride('ow', 'pv', 'oud');
    setFeedbackOverride('ow', 'pv', 'nieuw');
    expect(getFeedbackOverrides().ow.pv).toBe('nieuw');
  });

  it('bewaart andere overrides bij toevoegen van een nieuwe', () => {
    setFeedbackOverride('ow', 'pv', 'a');
    setFeedbackOverride('ow', 'lv', 'b');
    const overrides = getFeedbackOverrides();
    expect(overrides.ow.pv).toBe('a');
    expect(overrides.ow.lv).toBe('b');
  });
});

describe('resetFeedbackOverride', () => {
  it('verwijdert een specifieke override', () => {
    setFeedbackOverride('ow', 'pv', 'test');
    resetFeedbackOverride('ow', 'pv');
    expect(getFeedbackOverrides().ow).toBeUndefined();
  });

  it('verwijdert de sourceRole-sleutel als er geen targets meer zijn', () => {
    setFeedbackOverride('ow', 'pv', 'test');
    resetFeedbackOverride('ow', 'pv');
    expect(getFeedbackOverrides()).toEqual({});
  });

  it('bewaart andere targets bij verwijderen van één target', () => {
    setFeedbackOverride('ow', 'pv', 'a');
    setFeedbackOverride('ow', 'lv', 'b');
    resetFeedbackOverride('ow', 'pv');
    expect(getFeedbackOverrides().ow.lv).toBe('b');
  });

  it('doet niets bij onbekende source', () => {
    setFeedbackOverride('ow', 'pv', 'test');
    resetFeedbackOverride('onbekend', 'pv');
    expect(getFeedbackOverrides().ow.pv).toBe('test');
  });
});

describe('clearAllFeedbackOverrides', () => {
  it('verwijdert alle overrides', () => {
    setFeedbackOverride('ow', 'pv', 'test');
    clearAllFeedbackOverrides();
    expect(getFeedbackOverrides()).toEqual({});
  });
});

describe('exportFeedbackOverrides', () => {
  it('exporteert overrides als geformatteerde JSON-string', () => {
    setFeedbackOverride('ow', 'pv', 'test');
    const exported = exportFeedbackOverrides();
    const parsed = JSON.parse(exported);
    expect(parsed.ow.pv).toBe('test');
  });

  it('exporteert leeg object als er geen overrides zijn', () => {
    expect(JSON.parse(exportFeedbackOverrides())).toEqual({});
  });
});
