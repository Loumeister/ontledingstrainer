import { describe, it, expect } from 'vitest';
import { detectOwNumber } from './owNumberHeuristic';

describe('detectOwNumber', () => {
  describe('meervoudsindicatoren', () => {
    it('herkent "wij" als meervoud', () => {
      expect(detectOwNumber(['wij'])).toBe('pl');
    });

    it('herkent "jullie" als meervoud', () => {
      expect(detectOwNumber(['jullie'])).toBe('pl');
    });

    it('herkent "ze" als meervoud', () => {
      expect(detectOwNumber(['ze'])).toBe('pl');
    });

    it('herkent "alle leerlingen" als meervoud via "alle"', () => {
      expect(detectOwNumber(['alle', 'leerlingen'])).toBe('pl');
    });

    it('herkent "twee broers" als meervoud via telwoord', () => {
      expect(detectOwNumber(['twee', 'broers'])).toBe('pl');
    });

    it('herkent "veel kinderen" als meervoud via "veel"', () => {
      expect(detectOwNumber(['veel', 'kinderen'])).toBe('pl');
    });

    it('herkent "onze school" als meervoud via "onze"', () => {
      expect(detectOwNumber(['onze', 'school'])).toBe('pl');
    });
  });

  describe('enkelvoudsindicatoren', () => {
    it('herkent "ik" als enkelvoud', () => {
      expect(detectOwNumber(['ik'])).toBe('sg');
    });

    it('herkent "hij" als enkelvoud', () => {
      expect(detectOwNumber(['hij'])).toBe('sg');
    });

    it('herkent "een meisje" als enkelvoud via "een"', () => {
      expect(detectOwNumber(['een', 'meisje'])).toBe('sg');
    });

    it('herkent "het kind" als enkelvoud via "het"', () => {
      expect(detectOwNumber(['het', 'kind'])).toBe('sg');
    });

    it('herkent "jij" als enkelvoud via "jij"', () => {
      expect(detectOwNumber(['jij'])).toBe('sg');
    });
  });

  describe('morfologisch patroon (laatste token)', () => {
    it('herkent "de leerlingen" als meervoud via -en uitgang', () => {
      expect(detectOwNumber(['de', 'leerlingen'])).toBe('pl');
    });

    it('herkent "de docenten" als meervoud via -en uitgang', () => {
      expect(detectOwNumber(['de', 'docenten'])).toBe('pl');
    });

    it('herkent "de meisjes" als meervoud via -s uitgang', () => {
      expect(detectOwNumber(['de', 'meisjes'])).toBe('pl');
    });

    it('herkent "de jongens" als meervoud via -s uitgang', () => {
      expect(detectOwNumber(['de', 'jongens'])).toBe('pl');
    });
  });

  describe('hoofdletter-onafhankelijk', () => {
    it('herkent "Wij" (hoofdletter) als meervoud', () => {
      expect(detectOwNumber(['Wij'])).toBe('pl');
    });

    it('herkent "De Leerlingen" als meervoud via -en uitgang', () => {
      expect(detectOwNumber(['De', 'Leerlingen'])).toBe('pl');
    });

    it('herkent "Ik" als enkelvoud', () => {
      expect(detectOwNumber(['Ik'])).toBe('sg');
    });
  });

  describe('fallback naar enkelvoud', () => {
    it('behandelt onbekende eigennaam als enkelvoud', () => {
      // "Peter" eindigt niet op -s of -en → valt terug op enkelvoud
      expect(detectOwNumber(['Peter'])).toBe('sg');
    });

    it('behandelt "de school" als enkelvoud (geen mv-indicator, geen mv-uitgang)', () => {
      expect(detectOwNumber(['de', 'school'])).toBe('sg');
    });

    it('behandelt lege lijst als enkelvoud', () => {
      expect(detectOwNumber([])).toBe('sg');
    });
  });

  describe('meervoudsindicator wint van enkelvoudsindicator', () => {
    it('meervoudsindicator gaat voor enkelvoudsindicator als beide aanwezig', () => {
      // "wij" is mv-indicator, "een" is sg-indicator — mv wint (eerste stap)
      expect(detectOwNumber(['wij', 'een'])).toBe('pl');
    });
  });
});
