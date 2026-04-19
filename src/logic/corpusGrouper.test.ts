import { describe, it, expect } from 'vitest';
import {
  getSentenceSlotSignature,
  groupSentencesBySlotSignature,
  corpusToLabData,
} from './corpusGrouper';
import type { Sentence, Token } from '../types';

// ── Factory helpers ──────────────────────────────────────────────────────────

let _idCounter = 1;

function makeToken(text: string, role: Token['role'], extra?: Partial<Token>): Token {
  return { id: `t${_idCounter++}`, text, role, ...extra };
}

function makeSentence(
  tokens: Token[],
  overrides: Partial<Sentence> = {},
): Sentence {
  const id = _idCounter++;
  return {
    id,
    label: `Zin ${id}`,
    tokens,
    predicateType: 'WG',
    level: 1,
    ...overrides,
  };
}

/** Maakt een eenvoudige OW+PV+LV zin */
function makeOwPvLv(ow = 'De leerling', pv = 'leest', lv = 'het boek', overrides: Partial<Sentence> = {}): Sentence {
  return makeSentence([
    makeToken(ow, 'ow'),
    makeToken(pv, 'pv'),
    makeToken(lv, 'lv'),
  ], overrides);
}

/** Maakt een OW+PV+LV+BWB zin */
function makeOwPvLvBwb(overrides: Partial<Sentence> = {}): Sentence {
  return makeSentence([
    makeToken('De leerling', 'ow'),
    makeToken('leest', 'pv'),
    makeToken('het boek', 'lv'),
    makeToken('gisteren', 'bwb'),
  ], overrides);
}

/** Maakt een pool van n zinnen met hetzelfde signatuurpatroon */
function makePool(n: number, factory: (i: number) => Sentence): Sentence[] {
  return Array.from({ length: n }, (_, i) => factory(i));
}

// ── getSentenceSlotSignature ─────────────────────────────────────────────────

describe('getSentenceSlotSignature', () => {
  it('geeft ow-pv-lv voor een OW+PV+LV zin', () => {
    const s = makeOwPvLv();
    expect(getSentenceSlotSignature(s)).toBe('ow-pv-lv');
  });

  it('geeft ow-pv-lv-bwb voor een OW+PV+LV+BWB zin', () => {
    const s = makeOwPvLvBwb();
    expect(getSentenceSlotSignature(s)).toBe('ow-pv-lv-bwb');
  });

  it('dedupliceert rollen (herhalende OW-tokens tellen maar één keer)', () => {
    const s = makeSentence([
      makeToken('De', 'ow'),
      makeToken('leerling', 'ow'),
      makeToken('leest', 'pv'),
    ]);
    expect(getSentenceSlotSignature(s)).toBe('ow-pv');
  });

  it('negeert niet-frameSlotKey rollen zoals bijzin en bijv_bep', () => {
    const s = makeSentence([
      makeToken('De', 'ow'),
      makeToken('kleine', 'bijv_bep'),
      makeToken('leerling', 'ow'),
      makeToken('leest', 'pv'),
    ]);
    expect(getSentenceSlotSignature(s)).toBe('ow-pv');
  });

  it('bewaart de volgorde van eerste verschijning', () => {
    // Inversie: BWB staat voorop
    const s = makeSentence([
      makeToken('gisteren', 'bwb'),
      makeToken('leest', 'pv'),
      makeToken('de leerling', 'ow'),
      makeToken('het boek', 'lv'),
    ]);
    expect(getSentenceSlotSignature(s)).toBe('bwb-pv-ow-lv');
  });

  it('geeft lege string voor zin zonder frameSlotKeys', () => {
    const s = makeSentence([
      makeToken('omdat', 'bijzin'),
      makeToken('hij', 'bijv_bep'),
    ]);
    expect(getSentenceSlotSignature(s)).toBe('');
  });
});

// ── groupSentencesBySlotSignature ────────────────────────────────────────────

describe('groupSentencesBySlotSignature', () => {
  it('groepeert zinnen correct op signatuur', () => {
    const owPvLv = [makeOwPvLv(), makeOwPvLv(), makeOwPvLv()];
    const owPvLvBwb = [makeOwPvLvBwb(), makeOwPvLvBwb()];
    const groups = groupSentencesBySlotSignature([...owPvLv, ...owPvLvBwb]);

    expect(groups.get('ow-pv-lv')).toHaveLength(3);
    expect(groups.get('ow-pv-lv-bwb')).toHaveLength(2);
  });

  it('slaat zinnen zonder frameSlotKeys over', () => {
    const leeg = makeSentence([makeToken('omdat', 'bijzin')]);
    const normaal = makeOwPvLv();
    const groups = groupSentencesBySlotSignature([leeg, normaal]);

    expect(groups.size).toBe(1);
    expect(groups.get('ow-pv-lv')).toHaveLength(1);
  });

  it('geeft lege Map terug voor lege input', () => {
    expect(groupSentencesBySlotSignature([])).toEqual(new Map());
  });
});

// ── corpusToLabData ──────────────────────────────────────────────────────────

describe('corpusToLabData', () => {
  it('genereert geen frames voor groepen kleiner dan 3', () => {
    const zinnen = [makeOwPvLv(), makeOwPvLv()]; // slechts 2
    const { frames, cards } = corpusToLabData(zinnen);
    expect(frames).toHaveLength(0);
    expect(cards).toHaveLength(0);
  });

  it('genereert precies één frame voor een groep van 3 zinnen', () => {
    const zinnen = makePool(3, () => makeOwPvLv());
    const { frames } = corpusToLabData(zinnen);
    expect(frames).toHaveLength(1);
  });

  it('frame heeft de juiste slots', () => {
    const zinnen = makePool(3, () => makeOwPvLv());
    const { frames } = corpusToLabData(zinnen);
    expect(frames[0].slots).toEqual(['ow', 'pv', 'lv']);
  });

  it('frame-ID bevat de signatuur', () => {
    const zinnen = makePool(3, () => makeOwPvLv());
    const { frames } = corpusToLabData(zinnen);
    expect(frames[0].id).toContain('ow-pv-lv');
  });

  it('wordOrders volgt V2-regel: PV staat altijd op positie 2', () => {
    const zinnen = makePool(3, () => makeOwPvLv());
    const { frames } = corpusToLabData(zinnen);
    for (const order of frames[0].wordOrders) {
      expect(order.split('-')[1]).toBe('pv');
    }
  });

  it('genereert 3 kaarten per zin (één per slot)', () => {
    const zinnen = makePool(3, () => makeOwPvLv());
    const { cards } = corpusToLabData(zinnen);
    // 3 zinnen × 3 slots = 9 kaarten
    expect(cards).toHaveLength(9);
  });

  it('OW-kaart heeft number-annotatie', () => {
    const zinnen = makePool(3, (i) => makeSentence([
      makeToken(i === 0 ? 'De leerlingen' : 'De leerling', 'ow'),
      makeToken('leest', 'pv'),
      makeToken('het boek', 'lv'),
    ]));
    const { cards } = corpusToLabData(zinnen);
    const owCards = cards.filter(c => c.role === 'ow');
    owCards.forEach(c => expect(c.number).toBeDefined());
  });

  it('PV-kaart heeft verbTense-annotatie', () => {
    const zinnen = makePool(3, () => makeSentence([
      makeToken('de leerling', 'ow'),
      makeToken('werkte', 'pv'),
      makeToken('hard', 'lv'),
    ]));
    const { cards } = corpusToLabData(zinnen);
    const pvCards = cards.filter(c => c.role === 'pv');
    pvCards.forEach(c => expect(c.verbTense).toBe('past'));
  });

  it('BWB-kaart met tijdsreferentie heeft timeRef-annotatie', () => {
    const zinnen = makePool(3, () => makeOwPvLvBwb());
    const { cards } = corpusToLabData(zinnen);
    const bwbCards = cards.filter(c => c.role === 'bwb');
    bwbCards.forEach(c => expect(c.timeRef).toBe('past'));
  });

  it('docent-override voor owNumber heeft voorrang op heuristiek', () => {
    const zinnen = makePool(3, () => makeOwPvLv('de leerling', 'leest', 'het boek', { owNumber: 'pl' }));
    const { cards } = corpusToLabData(zinnen);
    const owCards = cards.filter(c => c.role === 'ow');
    owCards.forEach(c => expect(c.number).toBe('pl'));
  });

  it('docent-override voor pvTense heeft voorrang op heuristiek', () => {
    const zinnen = makePool(3, () => makeOwPvLv('de leerling', 'leest', 'het boek', { pvTense: 'past' }));
    const { cards } = corpusToLabData(zinnen);
    const pvCards = cards.filter(c => c.role === 'pv');
    pvCards.forEach(c => expect(c.verbTense).toBe('past'));
  });

  it('frames worden gesorteerd op niveau', () => {
    const level1 = makePool(3, () => makeOwPvLv('ik', 'ren', 'snel', { level: 1 }));
    const level3 = makePool(3, () => makeOwPvLvBwb({ level: 3 }));
    const { frames } = corpusToLabData([...level3, ...level1]);
    expect(frames[0].level).toBeLessThanOrEqual(frames[frames.length - 1].level);
  });

  it('genereert twee frames voor twee verschillende signaturen', () => {
    const owPvLv = makePool(3, () => makeOwPvLv());
    const owPvLvBwb = makePool(3, () => makeOwPvLvBwb());
    const { frames } = corpusToLabData([...owPvLv, ...owPvLvBwb]);
    expect(frames).toHaveLength(2);
  });

  it('geeft lege resultaten terug voor lege input', () => {
    const { frames, cards } = corpusToLabData([]);
    expect(frames).toHaveLength(0);
    expect(cards).toHaveLength(0);
  });
});
