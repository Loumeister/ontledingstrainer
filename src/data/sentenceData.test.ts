import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';
import { getBijzinAnalyseProblems, getBijzinTokenGroups } from '../logic/bijzinAnalysis';
import { BETREKKELIJKE_BIJZIN_LEVEL } from '../logic/validation';
import { ROLES_PER_LEVEL } from '../constants';
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
  it('geeft een betrekkelijk of vragend verbindingswoord geen label onderschikkend voegwoord', () => {
    const offenders = all.flatMap(s => s.tokens
      .filter(t => t.bijzinAnalyse?.verbindingswoord && (t.subRole === 'vw_onder' || t.bijzinAnalyse.role === 'vw_onder'))
      .map(t => `${s.id}:${t.text}`));
    expect(offenders).toEqual([]);
  });

  it('annoteert elke bijzin volledig of niet, met een PV en alleen rollen uit de bijzinkeuzelijst', () => {
    const problems = all.flatMap(s => getBijzinAnalyseProblems(s).map(p => `zin ${s.id}: ${p}`));
    expect(problems).toEqual([]);
  });

  it('heeft voor elke ingebouwde bijzin een bijzinontleding', () => {
    const missing = all.flatMap(s => getBijzinTokenGroups(s)
      .filter(group => !group.some(t => t.bijzinAnalyse))
      .map(group => `${s.id}:${group[0].text}`));
    expect(missing).toEqual([]);
  });
});

describe('zinnendata — wederkerende voornaamwoorden horen bij het WG', () => {
  it('rekent een verplicht wederkerend voornaamwoord tot het WG (zinnen 465, 466; 464 in de bijzin)', () => {
    expect(byId(465).tokens.find(t => t.text === 'zich,')?.role).toBe('wg');
    expect(byId(466).tokens.find(t => t.text === 'mij')?.role).toBe('wg');
    expect(byId(464).tokens.find(t => t.text === 'zich')?.bijzinAnalyse?.role).toBe('wg');
  });

  it('rekent ook een niet-verplicht wederkerend voornaamwoord tot het WG (zin 132)', () => {
    expect(byId(132).tokens.find(t => t.text === 'zich')?.role).toBe('wg');
  });

  it('labelt "zich" overal als deel van het WG, ook binnen een bijzin', () => {
    const offenders = all.flatMap(s => s.tokens
      .filter(t => /^zich[,.!?]?$/i.test(t.text))
      .filter(t => (t.role === 'bijzin' ? t.bijzinAnalyse?.role : t.role) !== 'wg')
      .map(t => `${s.id}:${t.text}`));
    expect(offenders).toEqual([]);
  });

  it('"zich vergissen in" heeft een voorzetselvoorwerp (zin 466)', () => {
    expect(byId(466).tokens.filter(t => ['in', 'het', 'lokaal,'].includes(t.text)).map(t => t.role)).toEqual(['vv', 'vv', 'vv']);
  });
});

describe('zinnendata — betrekkelijke bijzinnen', () => {
  it('staan alleen op het hoogste niveau', () => {
    const tooLow = all
      .filter(s => s.tokens.some(t => t.bijzinFunctie === 'bijv_bep'))
      .filter(s => s.level < BETREKKELIJKE_BIJZIN_LEVEL)
      .map(s => s.id);
    expect(tooLow).toEqual([]);
  });
});

describe('zinnendata — rollen per niveau en bijvoeglijke bepalingen', () => {
  it('gebruikt per niveau alleen hoofdrollen die op dat niveau bestaan (Instap: geen WG/NG)', () => {
    const offenders = all.flatMap(s => s.tokens
      .filter(t => !ROLES_PER_LEVEL[s.level].includes(t.role))
      .map(t => `${s.id}:${t.text} (${t.role})`));
    expect(offenders).toEqual([]);
  });

  it('laat elke bijvoeglijke bepaling naar een ander woord in dezelfde zin wijzen', () => {
    const offenders = all.flatMap(s => s.tokens
      .filter(t => t.bijvBepTarget && (t.bijvBepTarget === t.id || !s.tokens.some(o => o.id === t.bijvBepTarget)))
      .map(t => `${s.id}:${t.text}`));
    expect(offenders).toEqual([]);
  });
});
