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

describe('zinnendata — identiteit', () => {
  it('geeft elke zin een uniek id en het niveau van zijn bestand', () => {
    const files = [level0, level1, level2, level3, level4] as Sentence[][];
    expect(files.flatMap((f, level) => f.filter(s => s.level !== level).map(s => s.id))).toEqual([]);
    const ids = all.map(s => s.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('nummert tokens als s<zin-id>t<n>, met n de positie in de zin vanaf 1', () => {
    const offenders = all.flatMap(s => s.tokens
      .filter((t, i) => t.id !== `s${s.id}t${i + 1}`)
      .map(t => `${s.id}:${t.id}`));
    expect(offenders).toEqual([]);
  });

  it('heeft in elke zin een persoonsvorm', () => {
    expect(all.filter(s => !s.tokens.some(t => t.role === 'pv')).map(s => s.id)).toEqual([]);
  });
});

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

  it('"van de namiddag" is een bijvoeglijke bepaling bij licht, binnen het voorzetselvoorwerp (zin 100)', () => {
    const s = byId(100);
    expect(s.tokens.map(t => t.text).join(' ')).toBe('De natuurfotograaf rekent op het betere licht van de namiddag.');
    const licht = s.tokens.find(t => t.text === 'licht')!;
    const vdn = s.tokens.filter(t => ['van', 'de', 'namiddag.'].includes(t.text));
    expect(vdn.map(t => [t.role, t.subRole, t.bijvBepTarget, !!t.newChunk])).toEqual(Array(3).fill(['vv', 'bijv_bep', licht.id, false]));
  });

  it('zin 24 zet het MV met "aan" voorop, zodat alleen Sara het onderwerp kan zijn', () => {
    const s = byId(24);
    expect(s.tokens.map(t => t.text).join(' ')).toBe('Aan haar oma stuurt Sara een kaart.');
    expect(s.tokens.filter(t => t.role === 'ow').map(t => t.text)).toEqual(['Sara']);
    expect(s.tokens.filter(t => t.role === 'mv').map(t => t.text)).toEqual(['Aan', 'haar', 'oma']);
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

  it('geeft elke bijvoeglijke bepaling een doelwoord: op woordniveau, binnen een bijzin en als hele bijzin', () => {
    const wijstGoed = (s: Sentence, id: string, target?: string) =>
      !!target && target !== id && s.tokens.some(o => o.id === target);
    // Een bijvoeglijke bijzin bepaalt een woord in de hoofdzin, dus niet een woord van een bijzin.
    const wijstBuitenBijzin = (s: Sentence, target?: string) =>
      s.tokens.some(o => o.id === target && o.role !== 'bijzin');
    const offenders = all.flatMap(s => s.tokens.flatMap(t => [
      ...(t.subRole === 'bijv_bep' && !wijstGoed(s, t.id, t.bijvBepTarget) ? [`${s.id}:${t.text}`] : []),
      ...(t.bijzinAnalyse?.subRole === 'bijv_bep' && !wijstGoed(s, t.id, t.bijzinAnalyse.bijvBepTarget)
        ? [`${s.id}:${t.text} (in bijzin)`] : []),
      ...(t.bijzinFunctie === 'bijv_bep' && !wijstBuitenBijzin(s, t.bijvBepTarget)
        ? [`${s.id}:${t.text} (bijvoeglijke bijzin)`] : []),
    ]));
    expect(offenders).toEqual([]);
  });
});

describe('zinnendata — wederkerende werkwoorden', () => {
  const REFLEXIEF = /^(zich|me|mij|je|ons|jullie|u)[,.!?]?$/i;

  it('staan pas vanaf niveau Hoog, ook in een bijzin', () => {
    const tooLow = all
      .filter(s => s.level < 3)
      .filter(s => s.tokens.some(t => REFLEXIEF.test(t.text) && (t.role === 'bijzin' ? t.bijzinAnalyse?.role : t.role) === 'wg'))
      .map(s => s.id);
    expect(tooLow).toEqual([]);
  });
});

describe('zinnendata — lidwoordachtige woorden als bijvoeglijke bepaling', () => {
  const DETERMINATOR = /^(die|dat|deze|dit|elke|iedere|mijn|jouw|zijn|haar|onze|ons|hun|je|jullie|uw|twee|drie|veel|alle)$/i;

  it('markeert een bezittelijk, aanwijzend of onbepaald woord of telwoord vóór zijn kern altijd als BB', () => {
    const offenders = all.flatMap(s => s.tokens
      .filter((t, i) => {
        const next = s.tokens[i + 1];
        return DETERMINATOR.test(t.text) && !t.subRole && !!next && next.role === t.role && !next.newChunk
          && !['pv', 'bijzin', 'vw_neven'].includes(t.role);
      })
      .map(t => `${s.id}:${t.text}`));
    expect(offenders).toEqual([]);
  });
});
