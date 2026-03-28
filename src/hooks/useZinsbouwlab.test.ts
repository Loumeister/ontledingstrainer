/**
 * Tests voor useZinsbouwlab — getest via de onderliggende pure functies
 * en data-integratie (geen DOM nodig).
 *
 * buildSentence() wordt getest via validateConstruction + handmatige
 * state-simulatie. cardsForSlot-logica wordt getest via CHUNK_CARDS-filter.
 */
import { describe, it, expect } from 'vitest';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import { CHUNK_CARDS } from '../data/chunkCards';
import { validateConstruction } from '../logic/constructionValidation';
import type { ChunkCard, FrameSlotKey, Token } from '../types';

// ── Hulpfunctie: simuleer buildSentence logica ────────────────────────────────

function simulateBuildSentence(
  frameId: string,
  placedCards: Partial<Record<FrameSlotKey, ChunkCard>>,
  orderedSlots: FrameSlotKey[],
) {
  const frame = CONSTRUCTION_FRAMES.find(f => f.id === frameId);
  if (!frame) return null;

  const result = validateConstruction(frame, placedCards, orderedSlots);
  if (!result.ok) return null;

  const tokens: Token[] = orderedSlots.flatMap((slot, slotIdx) => {
    const card = placedCards[slot];
    if (!card) return [];
    return card.tokens.map((t, ti) => ({
      id: `zl-${frame.id}-s${slotIdx}-t${ti}`,
      text: t.text,
      role: t.role,
      subRole: t.subRole,
      newChunk: ti === 0 && slotIdx > 0,
    }));
  });

  return {
    id: 20000,
    label: `Zinsdeellab: ${frame.prompt.slice(0, 40)}`,
    tokens,
    predicateType: frame.predicateType,
    level: frame.level,
  };
}

// ── Hulpfunctie: cardsForSlot logica (uit useZinsbouwlab) ─────────────────────

function cardsForSlot(frameId: string, slot: FrameSlotKey): ChunkCard[] {
  return CHUNK_CARDS.filter(
    c => c.role === slot && c.frameIds.some(fid => fid === frameId),
  );
}

// ── Tests: CONSTRUCTION_FRAMES data-integriteit ───────────────────────────────

describe('CONSTRUCTION_FRAMES data', () => {
  it('bevat precies 4 frames', () => {
    expect(CONSTRUCTION_FRAMES).toHaveLength(4);
  });

  it('alle frame-ids zijn uniek', () => {
    const ids = CONSTRUCTION_FRAMES.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('elk frame heeft minstens één wordOrder', () => {
    for (const frame of CONSTRUCTION_FRAMES) {
      expect(frame.wordOrders.length).toBeGreaterThan(0);
    }
  });
});

// ── Tests: CHUNK_CARDS data-integriteit ──────────────────────────────────────

describe('CHUNK_CARDS data', () => {
  it('bevat minstens 40 kaarten', () => {
    expect(CHUNK_CARDS.length).toBeGreaterThanOrEqual(40);
  });

  it('alle card-ids zijn uniek', () => {
    const ids = CHUNK_CARDS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('elke kaart heeft minstens één token', () => {
    for (const card of CHUNK_CARDS) {
      expect(card.tokens.length).toBeGreaterThan(0);
    }
  });
});

// ── Tests: cardsForSlot filtering ────────────────────────────────────────────

describe('cardsForSlot filtering', () => {
  it('retourneert alleen OW-kaarten voor wg-ow-pv-lv frame', () => {
    const cards = cardsForSlot('wg-ow-pv-lv', 'ow');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.role).toBe('ow');
      expect(card.frameIds).toContain('wg-ow-pv-lv');
    }
  });

  it('retourneert alleen PV-kaarten voor wg-ow-pv-lv frame', () => {
    const cards = cardsForSlot('wg-ow-pv-lv', 'pv');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.role).toBe('pv');
    }
  });

  it('retourneert geen kaarten voor een slot dat niet in het frame zit', () => {
    // wg-ow-pv-lv heeft geen nwd-slot
    const cards = cardsForSlot('wg-ow-pv-lv', 'nwd');
    expect(cards).toHaveLength(0);
  });

  it('retourneert BWB-kaarten voor wg-ow-pv-lv-bwb frame', () => {
    const cards = cardsForSlot('wg-ow-pv-lv-bwb', 'bwb');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.role).toBe('bwb');
    }
  });

  it('retourneert NWD-kaarten voor ng-ow-pv-nwd-bwb frame', () => {
    const cards = cardsForSlot('ng-ow-pv-nwd-bwb', 'nwd');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.role).toBe('nwd');
    }
  });

  it('retourneert MV-kaarten voor wg-ow-pv-mv-lv frame', () => {
    const cards = cardsForSlot('wg-ow-pv-mv-lv', 'mv');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.role).toBe('mv');
    }
  });

  it('retourneert lege array voor onbekend frameId', () => {
    const cards = cardsForSlot('onbekend-frame', 'ow');
    expect(cards).toHaveLength(0);
  });
});

// ── Tests: buildSentence ──────────────────────────────────────────────────────

describe('buildSentence logica', () => {
  it('retourneert null bij ongeldige constructie (congruentiefout)', () => {
    const frame = CONSTRUCTION_FRAMES.find(f => f.id === 'wg-ow-pv-lv')!;
    // meervoud OW + enkelvoud PV → congruentiefout
    const owCard = CHUNK_CARDS.find(c => c.id === 'cc-tp-ow-01')!; // pl
    const pvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-pv-01')!; // sg
    const lvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-lv-01')!;

    const result = validateConstruction(
      frame,
      { ow: owCard, pv: pvCard, lv: lvCard },
      ['ow', 'pv', 'lv'],
    );
    expect(result.ok).toBe(false);

    const sentence = simulateBuildSentence(
      'wg-ow-pv-lv',
      { ow: owCard, pv: pvCard, lv: lvCard },
      ['ow', 'pv', 'lv'],
    );
    expect(sentence).toBeNull();
  });

  it('bouwt een correcte zin bij geldige transitief_sg constructie', () => {
    const owCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-ow-01')!; // "De leerling", sg
    const pvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-pv-01')!; // "leest", sg
    const lvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-lv-01')!; // "een boek"

    const sentence = simulateBuildSentence(
      'wg-ow-pv-lv',
      { ow: owCard, pv: pvCard, lv: lvCard },
      ['ow', 'pv', 'lv'],
    );

    expect(sentence).not.toBeNull();
    expect(sentence!.predicateType).toBe('WG');
    expect(sentence!.level).toBe(1);
    // Tokens: "De", "leerling", "leest", "een", "boek" = 5
    expect(sentence!.tokens).toHaveLength(5);
    const texts = sentence!.tokens.map(t => t.text);
    expect(texts).toEqual(['De', 'leerling', 'leest', 'een', 'boek']);
  });

  it('zet newChunk correct op het eerste token van elk slot (behalve het eerste)', () => {
    const owCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-ow-01')!;
    const pvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-pv-01')!;
    const lvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-lv-01')!;

    const sentence = simulateBuildSentence(
      'wg-ow-pv-lv',
      { ow: owCard, pv: pvCard, lv: lvCard },
      ['ow', 'pv', 'lv'],
    );

    expect(sentence).not.toBeNull();
    const tokens = sentence!.tokens;
    // Slot 0 (OW): "De" (ti=0, slotIdx=0) → newChunk = false
    expect(tokens[0].newChunk).toBe(false); // "De"
    // "leerling" (ti=1, slotIdx=0) → newChunk = false (ti !== 0)
    expect(tokens[1].newChunk).toBe(false);
    // Slot 1 (PV): "leest" (ti=0, slotIdx=1) → newChunk = true
    expect(tokens[2].newChunk).toBe(true);
    // Slot 2 (LV): "een" (ti=0, slotIdx=2) → newChunk = true
    expect(tokens[3].newChunk).toBe(true);
    // "boek" (ti=1, slotIdx=2) → newChunk = false
    expect(tokens[4].newChunk).toBe(false);
  });

  it('bouwt zin met MV in geven_sg frame', () => {
    const owCard = CHUNK_CARDS.find(c => c.id === 'cc-gs-ow-01')!; // "De docent", sg
    const pvCard = CHUNK_CARDS.find(c => c.id === 'cc-gs-pv-01')!; // "geeft", sg
    const mvCard = CHUNK_CARDS.find(c => c.id === 'cc-gs-mv-01')!; // "de leerling"
    const lvCard = CHUNK_CARDS.find(c => c.id === 'cc-gs-lv-01')!; // "een compliment"

    const sentence = simulateBuildSentence(
      'wg-ow-pv-mv-lv',
      { ow: owCard, pv: pvCard, mv: mvCard, lv: lvCard },
      ['ow', 'pv', 'mv', 'lv'],
    );

    expect(sentence).not.toBeNull();
    expect(sentence!.predicateType).toBe('WG');
    const texts = sentence!.tokens.map(t => t.text);
    expect(texts).toContain('geeft');
    expect(texts).toContain('leerling');
    expect(texts).toContain('compliment');
  });

  it('bouwt NG-zin met nwd in ng frame', () => {
    const owCard = CHUNK_CARDS.find(c => c.id === 'cc-ng-ow-01')!; // "Het weer", sg
    const pvCard = CHUNK_CARDS.find(c => c.id === 'cc-ng-pv-01')!; // "is", sg, NG
    const nwdCard = CHUNK_CARDS.find(c => c.id === 'cc-ng-nwd-01')!; // "rustig"
    const bwbCard = CHUNK_CARDS.find(c => c.id === 'cc-ng-bwb-01')!; // "vandaag"

    const sentence = simulateBuildSentence(
      'ng-ow-pv-nwd-bwb',
      { ow: owCard, pv: pvCard, nwd: nwdCard, bwb: bwbCard },
      ['ow', 'pv', 'nwd', 'bwb'],
    );

    expect(sentence).not.toBeNull();
    expect(sentence!.predicateType).toBe('NG');
    const texts = sentence!.tokens.map(t => t.text);
    expect(texts).toEqual(['Het', 'weer', 'is', 'rustig', 'vandaag']);
  });

  it('retourneert null als frame niet bestaat', () => {
    const sentence = simulateBuildSentence('niet-bestaand-frame', {}, []);
    expect(sentence).toBeNull();
  });

  it('retourneert null bij lege placedCards', () => {
    const sentence = simulateBuildSentence('wg-ow-pv-lv', {}, []);
    expect(sentence).toBeNull();
  });

  it('token-ids bevatten het frame-id en positie-indices', () => {
    const owCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-ow-01')!;
    const pvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-pv-01')!;
    const lvCard = CHUNK_CARDS.find(c => c.id === 'cc-ts-lv-01')!;

    const sentence = simulateBuildSentence(
      'wg-ow-pv-lv',
      { ow: owCard, pv: pvCard, lv: lvCard },
      ['ow', 'pv', 'lv'],
    );

    expect(sentence).not.toBeNull();
    for (const token of sentence!.tokens) {
      expect(token.id).toMatch(/^zl-wg-ow-pv-lv-s\d+-t\d+$/);
    }
  });
});
