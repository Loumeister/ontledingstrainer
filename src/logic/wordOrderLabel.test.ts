import { describe, it, expect } from 'vitest';
import {
  detectWordOrder,
  detectWordOrderFromRoles,
  wordOrderBadgeClass,
  wordOrderTooltip,
} from './wordOrderLabel';
import type { Token } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function t(role: string, idx = 0): Token {
  return { id: `s1w${idx}`, text: 'x', role: role as Token['role'] };
}

// ---------------------------------------------------------------------------
// detectWordOrderFromRoles
// ---------------------------------------------------------------------------

describe('detectWordOrderFromRoles', () => {
  it('SVO — OW before PV before LV', () => {
    const result = detectWordOrderFromRoles(['ow', 'pv', 'lv']);
    expect(result.code).toBe('SVO');
    expect(result.hasObject).toBe(true);
    expect(result.components).toEqual(['OW', 'PV', 'LV']);
  });

  it('SOV — OW before LV before PV (bijzin order)', () => {
    const result = detectWordOrderFromRoles(['ow', 'lv', 'pv']);
    expect(result.code).toBe('SOV');
  });

  it('VSO — PV before OW before LV (inversie)', () => {
    const result = detectWordOrderFromRoles(['pv', 'ow', 'lv']);
    expect(result.code).toBe('VSO');
  });

  it('VOS — PV before LV before OW', () => {
    const result = detectWordOrderFromRoles(['pv', 'lv', 'ow']);
    expect(result.code).toBe('VOS');
  });

  it('OVS — LV before PV before OW', () => {
    const result = detectWordOrderFromRoles(['lv', 'pv', 'ow']);
    expect(result.code).toBe('OVS');
  });

  it('OSV — LV before OW before PV', () => {
    const result = detectWordOrderFromRoles(['lv', 'ow', 'pv']);
    expect(result.code).toBe('OSV');
  });

  it('SV — OW before PV, no object', () => {
    const result = detectWordOrderFromRoles(['ow', 'pv']);
    expect(result.code).toBe('SV');
    expect(result.hasObject).toBe(false);
  });

  it('VS — PV before OW, no object (inversie)', () => {
    const result = detectWordOrderFromRoles(['pv', 'ow']);
    expect(result.code).toBe('VS');
  });

  it('? — no PV present', () => {
    const result = detectWordOrderFromRoles(['ow', 'lv']);
    expect(result.code).toBe('?');
  });

  it('? — no OW present', () => {
    const result = detectWordOrderFromRoles(['pv', 'lv']);
    expect(result.code).toBe('?');
  });

  it('uses MV as O when no LV present', () => {
    const result = detectWordOrderFromRoles(['ow', 'pv', 'mv']);
    expect(result.code).toBe('SVO');
    expect(result.hasObject).toBe(true);
    expect(result.components).toEqual(['OW', 'PV', 'MV']);
  });

  it('uses first LV when multiple object roles exist', () => {
    // LV appears before MV — LV wins
    const result = detectWordOrderFromRoles(['ow', 'pv', 'lv', 'mv']);
    expect(result.code).toBe('SVO');
    expect(result.components).toEqual(['OW', 'PV', 'LV']);
  });

  it('ignores non-SVO roles (BWB, WG, etc.)', () => {
    const result = detectWordOrderFromRoles(['bwb', 'pv', 'ow', 'lv', 'wg']);
    expect(result.code).toBe('VSO');
  });

  it('handles undefined / null slots (editor intermediate state)', () => {
    const result = detectWordOrderFromRoles(['ow', undefined, 'pv', null, 'lv']);
    expect(result.code).toBe('SVO');
  });

  it('uses FIRST occurrence of each role', () => {
    // Two OW groups — first one at index 0 determines S position
    const result = detectWordOrderFromRoles(['ow', 'pv', 'ow', 'lv']);
    expect(result.code).toBe('SVO');
  });
});

// ---------------------------------------------------------------------------
// detectWordOrder (Token[])
// ---------------------------------------------------------------------------

describe('detectWordOrder', () => {
  it('detects SVO from a typical Dutch declarative sentence', () => {
    const tokens = [
      t('ow', 0),  // Jan
      t('pv', 1),  // ziet
      t('lv', 2),  // hem
    ];
    expect(detectWordOrder(tokens).code).toBe('SVO');
  });

  it('detects VS from an inverted sentence without object', () => {
    const tokens = [
      t('bwb', 0), // Gisteren
      t('pv', 1),  // liep
      t('ow', 2),  // hij
    ];
    expect(detectWordOrder(tokens).code).toBe('VS');
  });

  it('detects VSO from inversie with object', () => {
    const tokens = [
      t('bwb', 0), // Vandaag
      t('pv', 1),  // ziet
      t('ow', 2),  // Jan
      t('lv', 3),  // hem
    ];
    expect(detectWordOrder(tokens).code).toBe('VSO');
  });

  it('detects SOV from bijzin-like order', () => {
    const tokens = [
      t('ow', 0),  // hij
      t('lv', 1),  // hem
      t('pv', 2),  // ziet
    ];
    expect(detectWordOrder(tokens).code).toBe('SOV');
  });

  it('returns ? when PV is missing', () => {
    const tokens = [t('ow', 0), t('lv', 1)];
    expect(detectWordOrder(tokens).code).toBe('?');
  });

  it('returns ? when OW is missing', () => {
    const tokens = [t('pv', 0), t('lv', 1)];
    expect(detectWordOrder(tokens).code).toBe('?');
  });
});

// ---------------------------------------------------------------------------
// wordOrderBadgeClass
// ---------------------------------------------------------------------------

describe('wordOrderBadgeClass', () => {
  it('returns green classes for SVO', () => {
    expect(wordOrderBadgeClass('SVO')).toContain('green');
  });

  it('returns amber classes for inversie (VS)', () => {
    expect(wordOrderBadgeClass('VS')).toContain('amber');
  });

  it('returns purple classes for SOV', () => {
    expect(wordOrderBadgeClass('SOV')).toContain('purple');
  });

  it('returns red classes for OVS', () => {
    expect(wordOrderBadgeClass('OVS')).toContain('red');
  });

  it('returns slate classes for unknown', () => {
    expect(wordOrderBadgeClass('?')).toContain('slate');
  });
});

// ---------------------------------------------------------------------------
// wordOrderTooltip
// ---------------------------------------------------------------------------

describe('wordOrderTooltip', () => {
  it('returns Dutch tooltip for SVO', () => {
    expect(wordOrderTooltip('SVO')).toMatch(/standaard/i);
  });

  it('returns Dutch tooltip for inversie codes', () => {
    expect(wordOrderTooltip('VSO')).toMatch(/inversie/i);
  });

  it('returns Dutch tooltip for SOV', () => {
    expect(wordOrderTooltip('SOV')).toMatch(/bijzin/i);
  });

  it('returns Dutch fallback for unknown', () => {
    expect(wordOrderTooltip('?')).toMatch(/onbekend/i);
  });
});
