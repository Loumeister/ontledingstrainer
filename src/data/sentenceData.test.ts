import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';
import level0 from './sentences-level-0.json';
import level1 from './sentences-level-1.json';
import level2 from './sentences-level-2.json';
import level3 from './sentences-level-3.json';
import level4 from './sentences-level-4.json';

const all = [level0, level1, level2, level3, level4].flat() as Sentence[];
const byId = (id: number) => all.find(s => s.id === id)!;

describe('zinnendata — gezegde-annotatie', () => {
  it('"De kat is op het dak": zijn = zich bevinden, dus BWB en geen NG (zin 324)', () => {
    const s = byId(324);
    expect(s.tokens.filter(t => ['op', 'het', 'dak,'].includes(t.text)).map(t => t.role)).toEqual(['bwb', 'bwb', 'bwb']);
    expect(s.tokens.find(t => t.text === 'is')?.subRole).toBeUndefined();
  });

  it('markeert in elke zin met een NG een PV als werkwoordelijk deel, en alleen dan', () => {
    // 68 "De regen maakt de straat spekglad": 'maken' is geen koppelwerkwoord; analyse wacht op docentbesluit.
    const pendingReview = [68];
    const offenders = all.filter(s => !pendingReview.includes(s.id)).filter(s => {
      const hasNg = s.tokens.some(t => t.role === 'ng');
      const hasWwdPv = s.tokens.some(t => t.role === 'pv' && t.subRole === 'wwd');
      return hasNg !== hasWwdPv;
    }).map(s => s.id);
    expect(offenders).toEqual([]);
  });

  it('labelt werkwoorden van een werkwoordelijk gezegde niet als NG', () => {
    expect(byId(403).tokens.find(t => t.text === 'afgerond.')?.role).toBe('wg');
    expect(byId(406).tokens.filter(t => ['willen', 'komen,'].includes(t.text)).map(t => t.role)).toEqual(['wg', 'wg']);
  });
});
