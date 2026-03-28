import { describe, it, expect } from 'vitest';
import { validateConstruction } from './constructionValidation';
import type { ConstructionFrame, ChunkCard, FrameSlotKey } from '../types';

// ── Helper factories ──────────────────────────────────────────────────────────

function makeFrame(overrides?: Partial<ConstructionFrame>): ConstructionFrame {
  return {
    id: 'wg-ow-pv-lv',
    label: 'OW + PV + LV',
    level: 1,
    predicateType: 'WG',
    slots: ['ow', 'pv', 'lv'],
    families: ['transitief_sg'],
    wordOrders: ['ow-pv-lv', 'bwb-pv-ow-lv'],
    prompt: 'Testprompt',
    ...overrides,
  };
}

function makeOwCard(overrides?: Partial<ChunkCard>): ChunkCard {
  return {
    id: 'cc-ts-ow-01',
    role: 'ow',
    familyId: 'transitief_sg',
    frameIds: ['wg-ow-pv-lv'],
    tokens: [{text: 'De', role: 'ow'}, {text: 'leerling', role: 'ow'}],
    number: 'sg',
    person: 3,
    ...overrides,
  };
}

function makePvCard(overrides?: Partial<ChunkCard>): ChunkCard {
  return {
    id: 'cc-ts-pv-01',
    role: 'pv',
    familyId: 'transitief_sg',
    frameIds: ['wg-ow-pv-lv'],
    tokens: [{text: 'leest', role: 'pv'}],
    number: 'sg',
    person: 3,
    predicateType: 'WG',
    ...overrides,
  };
}

function makeLvCard(overrides?: Partial<ChunkCard>): ChunkCard {
  return {
    id: 'cc-ts-lv-01',
    role: 'lv',
    familyId: 'transitief_sg',
    frameIds: ['wg-ow-pv-lv'],
    tokens: [{text: 'een', role: 'lv'}, {text: 'boek', role: 'lv'}],
    ...overrides,
  };
}

// ── Tests: ontbrekende slots ──────────────────────────────────────────────────

describe('validateConstruction — ontbrekende slots', () => {
  it('geeft feedback bij lege selectie', () => {
    const frame = makeFrame();
    const result = validateConstruction(frame, {}, []);
    expect(result.ok).toBe(false);
    expect(result.missingSlots).toEqual(['ow', 'pv', 'lv']);
    expect(result.feedback).toHaveLength(3);
    expect(result.feedback[0]).toContain('onderwerp');
    expect(result.feedback[1]).toContain('persoonsvorm');
    expect(result.feedback[2]).toContain('lijdend voorwerp');
  });

  it('geeft feedback bij gedeeltelijke selectie (alleen OW)', () => {
    const frame = makeFrame();
    const ow = makeOwCard();
    const result = validateConstruction(frame, { ow }, ['ow']);
    expect(result.ok).toBe(false);
    expect(result.missingSlots).toContain('pv');
    expect(result.missingSlots).toContain('lv');
    expect(result.missingSlots).not.toContain('ow');
  });

  it('missingSlots is leeg als alle slots aanwezig zijn', () => {
    const frame = makeFrame();
    const ow = makeOwCard();
    const pv = makePvCard();
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.missingSlots).toHaveLength(0);
  });
});

// ── Tests: congruentie ────────────────────────────────────────────────────────

describe('validateConstruction — congruentie', () => {
  it('geeft congruentiefout bij meervoud OW + enkelvoud PV', () => {
    const frame = makeFrame({ families: ['transitief_sg', 'transitief_pl'] });
    const ow = makeOwCard({
      id: 'cc-tp-ow-01',
      familyId: 'transitief_pl',
      tokens: [{text: 'De', role: 'ow'}, {text: 'leerlingen', role: 'ow'}],
      number: 'pl',
    });
    const pv = makePvCard({ number: 'sg' });
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.congruenceError).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.feedback.some(f => f.includes('meervoud'))).toBe(true);
  });

  it('geeft congruentiefout bij enkelvoud OW + meervoud PV', () => {
    const frame = makeFrame({ families: ['transitief_sg', 'transitief_pl'] });
    const ow = makeOwCard({ number: 'sg' });
    const pv = makePvCard({
      id: 'cc-tp-pv-01',
      familyId: 'transitief_pl',
      tokens: [{text: 'lezen', role: 'pv'}],
      number: 'pl',
    });
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.congruenceError).toBe(true);
    expect(result.feedback.some(f => f.includes('enkelvoud'))).toBe(true);
  });

  it('geeft geen congruentiefout bij overeenkomend getal', () => {
    const frame = makeFrame();
    const ow = makeOwCard({ number: 'sg' });
    const pv = makePvCard({ number: 'sg' });
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.congruenceError).toBe(false);
  });
});

// ── Tests: familie-mismatch ───────────────────────────────────────────────────

describe('validateConstruction — familie-mismatch', () => {
  it('geeft familyError als kaart uit verkeerde familie komt', () => {
    const frame = makeFrame({ families: ['transitief_sg'] });
    const ow = makeOwCard({ familyId: 'geven_sg' });
    const pv = makePvCard();
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.familyError).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.feedback.some(f => f.includes('past niet'))).toBe(true);
  });

  it('geeft geen familyError als alle kaarten uit toegestane families komen', () => {
    const frame = makeFrame();
    const ow = makeOwCard();
    const pv = makePvCard();
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.familyError).toBe(false);
  });
});

// ── Tests: gezegdetype ────────────────────────────────────────────────────────

describe('validateConstruction — gezegdetype', () => {
  it('geeft feedback als NG-PV gebruikt wordt in WG-frame', () => {
    const frame = makeFrame({ predicateType: 'WG', families: ['transitief_sg', 'ng_eigenschap_sg'] });
    const ow = makeOwCard();
    const pv = makePvCard({ predicateType: 'NG', tokens: [{text: 'is', role: 'pv'}] });
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.ok).toBe(false);
    expect(result.feedback.some(f => f.includes('naamwoordelijk gezegde'))).toBe(true);
  });

  it('geeft feedback als WG-PV gebruikt wordt in NG-frame', () => {
    const frame = makeFrame({
      id: 'ng-ow-pv-nwd-bwb',
      predicateType: 'NG',
      slots: ['ow', 'pv', 'nwd'],
      families: ['ng_eigenschap_sg', 'transitief_sg'],
      wordOrders: ['ow-pv-nwd'],
    });
    const ow = makeOwCard({ familyId: 'ng_eigenschap_sg' });
    const pv = makePvCard({ predicateType: 'WG', familyId: 'ng_eigenschap_sg' });
    const nwd: ChunkCard = {
      id: 'cc-ng-nwd-01', role: 'nwd', familyId: 'ng_eigenschap_sg',
      frameIds: ['ng-ow-pv-nwd-bwb'],
      tokens: [{text: 'rustig', role: 'nwd'}],
    };
    const result = validateConstruction(frame, { ow, pv, nwd }, ['ow', 'pv', 'nwd']);
    expect(result.ok).toBe(false);
    expect(result.feedback.some(f => f.includes('werkwoordelijk gezegde'))).toBe(true);
  });
});

// ── Tests: geldige constructie ────────────────────────────────────────────────

describe('validateConstruction — geldige constructie', () => {
  it('ok: true en geen feedback bij geldige OW+PV+LV in correcte volgorde', () => {
    const frame = makeFrame();
    const ow = makeOwCard();
    const pv = makePvCard();
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.ok).toBe(true);
    expect(result.feedback).toHaveLength(0);
    expect(result.congruenceError).toBe(false);
    expect(result.familyError).toBe(false);
    expect(result.orderError).toBe(false);
    expect(result.missingSlots).toHaveLength(0);
  });

  it('ok: true bij geldige alternatieve volgorde bwb-pv-ow-lv', () => {
    const frame = makeFrame();
    const ow = makeOwCard();
    const pv = makePvCard();
    const lv = makeLvCard();
    const bwb: ChunkCard = {
      id: 'cc-bwb-01', role: 'bwb', familyId: 'transitief_sg',
      frameIds: ['wg-ow-pv-lv'],
      tokens: [{text: 'gisteren', role: 'bwb'}],
    };
    // Frame met bwb in slots en wordOrders
    const frameWithBwb = makeFrame({
      slots: ['ow', 'pv', 'lv', 'bwb'],
      wordOrders: ['ow-pv-lv-bwb', 'bwb-pv-ow-lv'],
    });
    const result = validateConstruction(
      frameWithBwb,
      { ow, pv, lv, bwb },
      ['bwb', 'pv', 'ow', 'lv'],
    );
    expect(result.ok).toBe(true);
    expect(result.orderError).toBe(false);
  });
});

// ── Tests: woordvolgorde ──────────────────────────────────────────────────────

describe('validateConstruction — woordvolgorde', () => {
  it('geeft orderError bij ongeldige woordvolgorde', () => {
    const frame = makeFrame();
    const ow = makeOwCard();
    const pv = makePvCard();
    const lv = makeLvCard();
    // lv-ow-pv is geen geldige volgorde
    const result = validateConstruction(frame, { ow, pv, lv }, ['lv', 'ow', 'pv']);
    expect(result.orderError).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.feedback.some(f => f.includes('woordvolgorde'))).toBe(true);
  });

  it('controleert woordvolgorde niet als slots ontbreken', () => {
    const frame = makeFrame();
    const ow = makeOwCard();
    // pv en lv ontbreken — volgorde wordt niet gecontroleerd
    const result = validateConstruction(frame, { ow }, ['ow']);
    expect(result.orderError).toBe(false);
    expect(result.missingSlots).toContain('pv');
  });

  it('slaat woordvolgorde-check over als wordOrders leeg is', () => {
    const frame = makeFrame({ wordOrders: [] });
    const ow = makeOwCard();
    const pv = makePvCard();
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['lv', 'ow', 'pv']);
    expect(result.orderError).toBe(false);
  });
});

// ── Tests: valentie (requires / forbids) ─────────────────────────────────────

describe('validateConstruction — valentie', () => {
  it('geeft feedback als required slot ontbreekt', () => {
    const frame = makeFrame({ slots: ['ow', 'pv', 'lv', 'bwb'], wordOrders: [] });
    const ow = makeOwCard({ requires: ['bwb'] });
    const pv = makePvCard();
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv }, ['ow', 'pv', 'lv']);
    expect(result.ok).toBe(false);
    expect(result.feedback.some(f => f.includes('bwb'))).toBe(true);
  });

  it('geeft feedback als verboden slot aanwezig is', () => {
    const frame = makeFrame({ slots: ['ow', 'pv', 'lv', 'bwb'], wordOrders: [] });
    const bwb: ChunkCard = {
      id: 'cc-bwb-01', role: 'bwb', familyId: 'transitief_sg',
      frameIds: ['wg-ow-pv-lv'],
      tokens: [{text: 'gisteren', role: 'bwb'}],
    };
    const ow = makeOwCard({ forbids: ['bwb'] });
    const pv = makePvCard();
    const lv = makeLvCard();
    const result = validateConstruction(frame, { ow, pv, lv, bwb }, ['ow', 'pv', 'lv', 'bwb']);
    expect(result.ok).toBe(false);
    expect(result.feedback.some(f => f.includes('past niet samen'))).toBe(true);
  });
});
