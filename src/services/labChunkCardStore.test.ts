import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCustomCards,
  saveCustomCard,
  deleteCustomCard,
  generateCardId,
} from './labChunkCardStore';
import type { ChunkCard } from '../types';

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

function makeCard(id: string, overrides: Partial<ChunkCard> = {}): ChunkCard {
  return {
    id,
    role: 'ow',
    familyId: 'family-001',
    frameIds: ['frame-001'],
    tokens: [{ text: 'De leerling', role: 'ow' }],
    ...overrides,
  };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('getCustomCards', () => {
  it('geeft lege array terug als storage leeg is', () => {
    expect(getCustomCards()).toEqual([]);
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store['zinsdeellab_cards_v1'] = 'GEEN JSON{';
    expect(getCustomCards()).toEqual([]);
  });
});

describe('saveCustomCard', () => {
  it('voegt een nieuwe kaart toe', () => {
    saveCustomCard(makeCard('cc-001'));
    expect(getCustomCards()).toHaveLength(1);
  });

  it('overschrijft een bestaande kaart op id (upsert)', () => {
    saveCustomCard(makeCard('cc-001', { familyId: 'oud' }));
    saveCustomCard(makeCard('cc-001', { familyId: 'nieuw' }));
    expect(getCustomCards()).toHaveLength(1);
    expect(getCustomCards()[0].familyId).toBe('nieuw');
  });

  it('bewaart meerdere kaarten', () => {
    saveCustomCard(makeCard('cc-001'));
    saveCustomCard(makeCard('cc-002'));
    expect(getCustomCards()).toHaveLength(2);
  });
});

describe('deleteCustomCard', () => {
  it('verwijdert de opgegeven kaart', () => {
    saveCustomCard(makeCard('cc-001'));
    saveCustomCard(makeCard('cc-002'));
    deleteCustomCard('cc-001');
    expect(getCustomCards()).toHaveLength(1);
    expect(getCustomCards()[0].id).toBe('cc-002');
  });

  it('doet niets bij onbekend id', () => {
    saveCustomCard(makeCard('cc-001'));
    deleteCustomCard('onbekend');
    expect(getCustomCards()).toHaveLength(1);
  });
});

describe('generateCardId', () => {
  it('genereert een id op basis van role en familyId', () => {
    const id = generateCardId('ow', 'family-001', []);
    expect(id).toMatch(/^cc-custom-ow-/);
    expect(id).toMatch(/-01$/);
  });

  it('verhoogt het nummersuffix als de basis al bestaat', () => {
    const base = generateCardId('ow', 'family-001', []);
    const second = generateCardId('ow', 'family-001', [base]);
    expect(second).toMatch(/-02$/);
  });

  it('verhoogt verder als meerdere ids al bestaan', () => {
    const first = generateCardId('ow', 'family-001', []);
    const second = generateCardId('ow', 'family-001', [first]);
    const third = generateCardId('ow', 'family-001', [first, second]);
    expect(third).toMatch(/-03$/);
  });
});
