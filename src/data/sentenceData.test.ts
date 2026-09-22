import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';
import { buildBijzinSentence, getBijzinTokenGroups } from '../logic/bijzinAnalysis';
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
    const offenders = all.filter(s => {
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

describe('zinnendata — docentcorrecties', () => {
  it('"lijken op" is een voorzetselvoorwerp (zin 149)', () => {
    const s = byId(149);
    expect(s.predicateType).toBe('WG');
    expect(s.tokens.filter(t => ['op', 'je', 'vader.'].includes(t.text)).map(t => t.role)).toEqual(['vv', 'vv', 'vv']);
  });

  it('zin 68 gebruikt een koppelwerkwoord en is daarmee eenduidig', () => {
    expect(byId(68).tokens.map(t => t.text).join(' ')).toBe('Door de regen is de straat spekglad.');
  });

  it('"opvallend stil" is samen het naamwoordelijk deel (zin 341)', () => {
    const s = byId(341);
    expect(s.predicateType).toBe('NG');
    expect(s.tokens.filter(t => ['opvallend', 'stil.'].includes(t.text)).map(t => t.role)).toEqual(['ng', 'ng']);
  });

  it('"Dat jullie de opdracht al snapten" is LV-bijzin bij vertellen (zin 440)', () => {
    expect(byId(440).tokens[0].bijzinFunctie).toBe('lv');
  });
});

describe('zinnendata — bijzinontleding', () => {
  it('annoteert een bijzin volledig of helemaal niet, en een geannoteerde bijzin heeft een PV', () => {
    for (const s of all) {
      for (const group of getBijzinTokenGroups(s)) {
        const annotated = group.filter(t => t.bijzinAnalyse).length;
        if (annotated === 0) continue;
        expect(annotated, `zin ${s.id}`).toBe(group.length);
        expect(buildBijzinSentence(s, group)?.tokens.some(t => t.role === 'pv'), `zin ${s.id}`).toBe(true);
      }
    }
  });
});
