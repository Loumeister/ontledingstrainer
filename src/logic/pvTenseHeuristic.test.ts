import { describe, it, expect } from 'vitest';
import { detectPvTense } from './pvTenseHeuristic';

describe('detectPvTense', () => {
  describe('sterke werkwoorden (verleden tijd)', () => {
    it('herkent "was" als verleden tijd', () => {
      expect(detectPvTense('was')).toBe('past');
    });

    it('herkent "waren" als verleden tijd', () => {
      expect(detectPvTense('waren')).toBe('past');
    });

    it('herkent "had" als verleden tijd', () => {
      expect(detectPvTense('had')).toBe('past');
    });

    it('herkent "ging" als verleden tijd', () => {
      expect(detectPvTense('ging')).toBe('past');
    });

    it('herkent "kreeg" als verleden tijd', () => {
      expect(detectPvTense('kreeg')).toBe('past');
    });

    it('herkent "zag" als verleden tijd', () => {
      expect(detectPvTense('zag')).toBe('past');
    });

    it('herkent "at" als verleden tijd (niet gevangen door zwak patroon)', () => {
      expect(detectPvTense('at')).toBe('past');
    });

    it('herkent "vroeg" als verleden tijd', () => {
      expect(detectPvTense('vroeg')).toBe('past');
    });
  });

  describe('sterke werkwoorden zijn hoofdletter-onafhankelijk', () => {
    it('herkent "Was" (hoofdletter) als verleden tijd', () => {
      expect(detectPvTense('Was')).toBe('past');
    });

    it('herkent "WAREN" als verleden tijd', () => {
      expect(detectPvTense('WAREN')).toBe('past');
    });
  });

  describe('zwakke werkwoorden op -de/-te (verleden tijd)', () => {
    it('herkent "werkte" als verleden tijd', () => {
      expect(detectPvTense('werkte')).toBe('past');
    });

    it('herkent "speelde" als verleden tijd', () => {
      expect(detectPvTense('speelde')).toBe('past');
    });

    it('herkent "luisterde" als verleden tijd', () => {
      expect(detectPvTense('luisterde')).toBe('past');
    });

    it('herkent "fietste" als verleden tijd', () => {
      expect(detectPvTense('fietste')).toBe('past');
    });
  });

  describe('zwakke werkwoorden op -den/-ten (verleden tijd)', () => {
    it('herkent "werkten" als verleden tijd', () => {
      expect(detectPvTense('werkten')).toBe('past');
    });

    it('herkent "speelden" als verleden tijd', () => {
      expect(detectPvTense('speelden')).toBe('past');
    });

    it('herkent "fietsten" als verleden tijd', () => {
      expect(detectPvTense('fietsten')).toBe('past');
    });
  });

  describe('tegenwoordige tijd (fallback)', () => {
    it('herkent "leest" als tegenwoordige tijd', () => {
      expect(detectPvTense('leest')).toBe('present');
    });

    it('herkent "loopt" als tegenwoordige tijd', () => {
      expect(detectPvTense('loopt')).toBe('present');
    });

    it('herkent "is" als tegenwoordige tijd', () => {
      expect(detectPvTense('is')).toBe('present');
    });

    it('herkent "zijn" als tegenwoordige tijd', () => {
      expect(detectPvTense('zijn')).toBe('present');
    });

    it('herkent "hebben" als tegenwoordige tijd', () => {
      expect(detectPvTense('hebben')).toBe('present');
    });

    it('herkent "werkt" als tegenwoordige tijd', () => {
      expect(detectPvTense('werkt')).toBe('present');
    });
  });

  describe('grensgevallen', () => {
    it('korte woorden onder 4 tekens op -de/-te worden niet als zwakke vt herkend', () => {
      // "ste" is 3 tekens, valt niet onder de zwakke-vt regel (length >= 4)
      expect(detectPvTense('ste')).toBe('present');
    });

    it('"te" (2 tekens) wordt niet als zwakke vt herkend', () => {
      expect(detectPvTense('te')).toBe('present');
    });
  });
});
