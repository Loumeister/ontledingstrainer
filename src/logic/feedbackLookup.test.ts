import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEffectiveFeedback } from './feedbackLookup';

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

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('getEffectiveFeedback', () => {
  describe('fallback naar FEEDBACK_MATRIX', () => {
    it('geeft feedback terug voor bekend paar (ow → pv)', () => {
      const result = getEffectiveFeedback('ow', 'pv');
      expect(result).toBeDefined();
    });

    it('geeft undefined voor volledig onbekend paar', () => {
      expect(getEffectiveFeedback('onbekend', 'ook_onbekend')).toBeUndefined();
    });

    it('geeft undefined als sourceRole bestaat maar targetRole niet', () => {
      expect(getEffectiveFeedback('ow', 'onbekende_target')).toBeUndefined();
    });
  });

  describe('localStorage overschrijft FEEDBACK_MATRIX', () => {
    it('geeft override terug als die aanwezig is', () => {
      const override = 'Aangepaste feedbacktekst';
      store['feedbackOverrides'] = JSON.stringify({ ow: { pv: override } });

      const result = getEffectiveFeedback('ow', 'pv');
      expect(result).toBe(override);
    });

    it('geeft matrix-waarde terug als alleen andere sleutel overridden is', () => {
      store['feedbackOverrides'] = JSON.stringify({ ow: { lv: 'Andere override' } });

      const result = getEffectiveFeedback('ow', 'pv');
      // Geen override voor ow→pv, dus matrix-waarde
      expect(result).toBeDefined();
      expect(result).not.toBe('Andere override');
    });

    it('geeft matrix-waarde terug als localStorage leeg is', () => {
      const withoutOverride = getEffectiveFeedback('ow', 'pv');
      store['feedbackOverrides'] = JSON.stringify({});
      const withEmptyOverride = getEffectiveFeedback('ow', 'pv');
      expect(withEmptyOverride).toEqual(withoutOverride);
    });

    it('valt terug op matrix als localStorage ongeldig JSON bevat', () => {
      store['feedbackOverrides'] = 'GEEN GELDIG JSON{{{';
      const result = getEffectiveFeedback('ow', 'pv');
      expect(result).toBeDefined();
    });
  });
});
