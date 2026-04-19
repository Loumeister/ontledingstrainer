import { describe, it, expect } from 'vitest';
import { detectBwbTimeRef } from './bwbTimeRefHeuristic';

describe('detectBwbTimeRef', () => {
  describe('verleden-tijdsreferentie', () => {
    it('herkent "gisteren" als past', () => {
      expect(detectBwbTimeRef(['gisteren'])).toBe('past');
    });

    it('herkent "vroeger" als past', () => {
      expect(detectBwbTimeRef(['vroeger'])).toBe('past');
    });

    it('herkent "toen" als past', () => {
      expect(detectBwbTimeRef(['toen'])).toBe('past');
    });

    it('herkent "onlangs" als past', () => {
      expect(detectBwbTimeRef(['onlangs'])).toBe('past');
    });

    it('herkent "geleden" als past', () => {
      expect(detectBwbTimeRef(['geleden'])).toBe('past');
    });

    it('herkent "vorige" in "vorige week" als past', () => {
      expect(detectBwbTimeRef(['vorige', 'week'])).toBe('past');
    });

    it('herkent dagnaanduiding "maandag" als past', () => {
      expect(detectBwbTimeRef(['maandag'])).toBe('past');
    });

    it('herkent maandnaam "januari" als past', () => {
      expect(detectBwbTimeRef(['januari'])).toBe('past');
    });

    it('herkent "afgelopen" als past', () => {
      expect(detectBwbTimeRef(['afgelopen'])).toBe('past');
    });
  });

  describe('heden-tijdsreferentie', () => {
    it('herkent "nu" als present', () => {
      expect(detectBwbTimeRef(['nu'])).toBe('present');
    });

    it('herkent "vandaag" als present', () => {
      expect(detectBwbTimeRef(['vandaag'])).toBe('present');
    });

    it('herkent "momenteel" als present', () => {
      expect(detectBwbTimeRef(['momenteel'])).toBe('present');
    });

    it('herkent "tegenwoordig" als present', () => {
      expect(detectBwbTimeRef(['tegenwoordig'])).toBe('present');
    });

    it('herkent "altijd" als present', () => {
      expect(detectBwbTimeRef(['altijd'])).toBe('present');
    });

    it('herkent "dagelijks" als present', () => {
      expect(detectBwbTimeRef(['dagelijks'])).toBe('present');
    });
  });

  describe('geen tijdsreferentie (plaatsbepaling of neutrale BWB)', () => {
    it('geeft undefined voor "thuis"', () => {
      expect(detectBwbTimeRef(['thuis'])).toBeUndefined();
    });

    it('geeft undefined voor "op school"', () => {
      expect(detectBwbTimeRef(['op', 'school'])).toBeUndefined();
    });

    it('geeft undefined voor "in de tuin"', () => {
      expect(detectBwbTimeRef(['in', 'de', 'tuin'])).toBeUndefined();
    });

    it('geeft undefined voor lege lijst', () => {
      expect(detectBwbTimeRef([])).toBeUndefined();
    });

    it('geeft undefined voor "snel"', () => {
      expect(detectBwbTimeRef(['snel'])).toBeUndefined();
    });
  });

  describe('hoofdletter-onafhankelijk', () => {
    it('herkent "Gisteren" (hoofdletter) als past', () => {
      expect(detectBwbTimeRef(['Gisteren'])).toBe('past');
    });

    it('herkent "Nu" (hoofdletter) als present', () => {
      expect(detectBwbTimeRef(['Nu'])).toBe('present');
    });
  });

  describe('meertokens-combinaties', () => {
    it('herkent "vandaag de dag" als present via samengevoegde string', () => {
      expect(detectBwbTimeRef(['vandaag', 'de', 'dag'])).toBe('present');
    });

    it('herkent "in het verleden" als past via samengevoegde string', () => {
      expect(detectBwbTimeRef(['in', 'het', 'verleden'])).toBe('past');
    });

    it('herkent "elke dag" als present via samengevoegde string', () => {
      expect(detectBwbTimeRef(['elke', 'dag'])).toBe('present');
    });
  });

  describe('eerste treffer wint', () => {
    it('geeft past als past-woord eerder in de lijst staat', () => {
      expect(detectBwbTimeRef(['gisteren', 'nu'])).toBe('past');
    });

    it('geeft present als present-woord eerder in de lijst staat', () => {
      expect(detectBwbTimeRef(['nu', 'gisteren'])).toBe('present');
    });
  });
});
