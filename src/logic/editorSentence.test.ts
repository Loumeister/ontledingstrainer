import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';
import { buildEditorTokens, carryOverBijzinAnalyse, editorAnnotationFromSentence, getBetrekkelijkeBijzinLevelWarning, getDroppedFields, buildEditorSentence } from './editorSentence';
import { buildBijzinSentence, getBijzinTokenGroups } from './bijzinAnalysis';
import { getLostBijzinAnalyses } from './bijzinEditor';
import level0 from '../data/sentences-level-0.json';
import level1 from '../data/sentences-level-1.json';
import level2 from '../data/sentences-level-2.json';
import level3 from '../data/sentences-level-3.json';
import level4 from '../data/sentences-level-4.json';

const all = [...level3, ...level4] as Sentence[];
const byId = (id: number) => all.find(s => s.id === id)!;

/** Open a stored sentence in the editor, optionally change the editor state, and rebuild the tokens. */
function reopen(s: Sentence, change?: (a: ReturnType<typeof editorAnnotationFromSentence>) => void) {
  const annotation = editorAnnotationFromSentence(s);
  change?.(annotation);
  const tokens = carryOverBijzinAnalyse(s, buildEditorTokens(s.id, annotation));
  return { tokens, lostBijzinnen: getLostBijzinAnalyses(s, { ...s, tokens }) };
}

describe('zinseditor — bijzinontleding bij opslaan', () => {
  it('behoudt de bijzinontleding van zin 330 als er niets verandert', () => {
    const { tokens, lostBijzinnen } = reopen(byId(330));
    expect(tokens.map(t => t.bijzinAnalyse)).toEqual(byId(330).tokens.map(t => t.bijzinAnalyse));
    expect(lostBijzinnen).toEqual([]);
    const saved = { ...byId(330), tokens };
    expect(buildBijzinSentence(saved, getBijzinTokenGroups(saved)[0])?.tokens.map(t => t.role)).toEqual(['vw_onder', 'ow', 'bwb', 'pv']);
  });

  it('behoudt elke ingebouwde bijzinontleding bij opslaan zonder wijziging', () => {
    for (const s of all.filter(s => s.tokens.some(t => t.bijzinAnalyse))) {
      const { tokens, lostBijzinnen } = reopen(s);
      expect(lostBijzinnen, `zin ${s.id}`).toEqual([]);
      expect(tokens.filter(t => t.bijzinAnalyse).length, `zin ${s.id}`).toBe(s.tokens.filter(t => t.bijzinAnalyse).length);
    }
  });

  it('laat bijvBepTarget binnen de bijzin naar het nieuwe token-ID wijzen (zin 405)', () => {
    const { tokens } = reopen(byId(405));
    const targets = tokens.map(t => t.bijzinAnalyse?.bijvBepTarget).filter(Boolean) as string[];
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) expect(tokens.some(t => t.id === target)).toBe(true);
  });

  it('behoudt de bijzinontleding als alleen een woord buiten de bijzin verandert', () => {
    const { tokens, lostBijzinnen } = reopen(byId(330), a => { a.words[0] = 'Jullie'; });
    expect(lostBijzinnen).toEqual([]);
    expect(tokens.filter(t => t.bijzinAnalyse)).toHaveLength(4);
  });

  it('behoudt de bijzinontleding als er vóór de bijzin een woord bijkomt', () => {
    const { tokens, lostBijzinnen } = reopen(byId(330), a => {
      // "Wij bleven lekker binnen omdat het hard regende."
      a.words.splice(2, 0, 'lekker');
      a.splitIndices = new Set([0, 1, 3]);
      a.chunkLabels = { 0: 'ow', 1: 'pv', 2: 'bwb', 3: 'bijzin' };
      a.bijzinFunctieLabels = { 3: 'bwb' };
    });
    expect(lostBijzinnen).toEqual([]);
    expect(tokens.map(t => t.bijzinAnalyse?.role)).toEqual([undefined, undefined, undefined, undefined, 'vw_onder', 'ow', 'bwb', 'pv']);
  });

  it('zet bijvBepTarget om als de bijzin verschuift (zin 405)', () => {
    const { tokens, lostBijzinnen } = reopen(byId(405), a => {
      a.words.unshift('Gisteren,');
      const shift = <T,>(r: Record<string, T>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [Number(k) + 1, v]));
      a.splitIndices = new Set([0, ...[...a.splitIndices].map(i => i + 1)]);
      a.chunkLabels = { 0: 'bwb', ...shift(a.chunkLabels) };
      a.bijzinFunctieLabels = shift(a.bijzinFunctieLabels);
      a.subLabels = Object.fromEntries(Object.entries(a.subLabels).map(([k, v]) => [`w${Number(k.slice(1)) + 1}`, v]));
    });
    expect(lostBijzinnen).toEqual([]);
    const withTarget = tokens.find(t => t.bijzinAnalyse?.bijvBepTarget)!;
    const target = tokens.find(t => t.id === withTarget.bijzinAnalyse!.bijvBepTarget)!;
    const original = byId(405).tokens.find(t => t.bijzinAnalyse?.bijvBepTarget)!;
    expect(target.text).toBe(byId(405).tokens.find(t => t.id === original.bijzinAnalyse!.bijvBepTarget)!.text);
  });

  it('meldt de bijzin als een woord in de bijzin verandert', () => {
    const { tokens, lostBijzinnen } = reopen(byId(330), a => { a.words[5] = 'zacht'; });
    expect(lostBijzinnen).toEqual(['omdat het hard regende.']);
    expect(tokens.some(t => t.bijzinAnalyse)).toBe(false);
  });

  it('meldt de bijzin als de bijzingrens verandert', () => {
    // "binnen" (BWB) wordt bij de bijzin getrokken
    const { lostBijzinnen } = reopen(byId(330), a => {
      a.splitIndices.delete(2);
      a.chunkLabels = { 0: 'ow', 1: 'pv', 2: 'bijzin' };
      a.bijzinFunctieLabels = { 2: 'bwb' };
    });
    expect(lostBijzinnen).toEqual(['omdat het hard regende.']);
  });

  it('doet niets voor een nieuwe zin', () => {
    const tokens = buildEditorTokens(1, editorAnnotationFromSentence(byId(330)));
    expect(carryOverBijzinAnalyse(null, tokens)).toBe(tokens);
  });
});

describe('zinseditor — betrekkelijke bijzin onder het hoogste niveau', () => {
  const functies = (id: number) => byId(id).tokens.filter(t => t.role === 'bijzin').map(t => t.bijzinFunctie);
  const tokens = byId(410).tokens;

  it('waarschuwt onder niveau 4', () => {
    expect(tokens.some(t => t.bijzinFunctie === 'bijv_bep')).toBe(true);
    expect(getBetrekkelijkeBijzinLevelWarning(functies(410), 3)).toContain('geen functie van de betrekkelijke bijzin');
  });

  it('waarschuwt niet op niveau 4', () => {
    expect(getBetrekkelijkeBijzinLevelWarning(functies(410), 4)).toBeNull();
  });

  it('waarschuwt niet bij een andere bijzin', () => {
    expect(getBetrekkelijkeBijzinLevelWarning(functies(330), 1)).toBeNull();
  });
});

describe('zinseditor — opslaan (buildEditorSentence)', () => {
  const alle = [level0, level1, level2, level3, level4].flat() as Sentence[];
  type Annotation = ReturnType<typeof editorAnnotationFromSentence>;
  /** Open a stored sentence in the editor, optionally change the editor state, and save it. */
  const opslaan = (s: Sentence, change?: (a: Annotation) => void): Sentence => {
    const annotation = editorAnnotationFromSentence(s);
    change?.(annotation);
    return buildEditorSentence({
      id: s.id, label: s.label, predicateType: s.predicateType, level: s.level,
      owNumber: s.owNumber ?? null, pvTense: s.pvTense ?? null,
      annotation, source: s, bijzinEdits: {},
    });
  };
  /** A real change of structure: the last chunk gets another role. */
  const laatsteDeelAnders = (a: Annotation) => {
    const last = Math.max(...Object.keys(a.chunkLabels).map(Number));
    a.chunkLabels[last] = a.chunkLabels[last] === 'bijst' ? 'bwb' : 'bijst';
  };

  it('geeft bij opslaan zonder wijziging elke ingebouwde zin ongewijzigd terug', () => {
    for (const s of alle) {
      expect(opslaan(s), `zin ${s.id}`).toEqual(s);
      expect(getDroppedFields(s, opslaan(s)), `zin ${s.id}`).toEqual([]);
    }
  });

  it('neemt alleen de zinsvelden van de docent over bij opslaan zonder structuurwijziging', () => {
    const s = alle.find(x => x.structuralTags)!;
    const annotation = editorAnnotationFromSentence(s);
    const saved = buildEditorSentence({
      id: s.id, label: 'Nieuw label', predicateType: s.predicateType, level: s.level,
      owNumber: 'pl', pvTense: null, annotation, source: s, bijzinEdits: {},
    });
    expect(saved).toEqual({ ...s, label: 'Nieuw label', owNumber: 'pl' });
    expect(saved.tokens[0].id).toBe(s.tokens[0].id);
  });

  it('bouwt een nieuwe zin op uit de editor', () => {
    const s = alle.find(x => x.id === 330)!;
    const saved = buildEditorSentence({
      id: 10001, label: 'Nieuw', predicateType: 'WG', level: 1, owNumber: null, pvTense: null,
      annotation: editorAnnotationFromSentence(s), source: null, bijzinEdits: {},
    });
    expect(saved.tokens[0].id).toBe('c10001t1');
    expect(saved.tokens.some(t => t.bijzinAnalyse)).toBe(false);
  });

  it('meldt na een structuurwijziging precies de zinnen met velden die de editor niet kent', () => {
    // Onafhankelijke beschrijving van de data: woordniveau-bijvBepTarget, alternativeRole of structuralTags.
    const verwacht = alle
      .filter(s => s.structuralTags || s.tokens.some(t => t.alternativeRole || (t.bijvBepTarget && t.role !== 'bijzin')))
      .map(s => s.id);
    const gemeld = alle.filter(s => getDroppedFields(s, opslaan(s, laatsteDeelAnders)).length > 0).map(s => s.id);
    expect(gemeld).toEqual(verwacht);
    expect(gemeld.length).toBeGreaterThan(0);
  });

  it('noemt per veld de woorden (zin 3: bijvoeglijke bepalingen)', () => {
    const s = alle.find(x => x.id === 3)!;
    const dropped = getDroppedFields(s, opslaan(s, laatsteDeelAnders));
    expect(dropped.find(d => d.field === 'bijvBepTarget')?.words).toEqual(['voor', 'zaterdag']);
    expect(dropped.find(d => d.field === 'bijvBepTarget')?.label).toContain('bijvoeglijke bepaling');
  });

  it('meldt structuralTags als veld van de hele zin, en een onbekend veld leesbaar', () => {
    const s = { ...alle.find(x => x.structuralTags)!, notitie: 'x' } as Sentence;
    const dropped = getDroppedFields(s, opslaan(s, laatsteDeelAnders));
    expect(dropped.find(d => d.field === 'structuralTags')).toMatchObject({ words: [] });
    expect(dropped.find(d => d.field === 'notitie')?.label).toBe('ander veld (notitie)');
  });

  it('meldt niets voor een nieuwe zin', () => {
    expect(getDroppedFields(null, alle[0])).toEqual([]);
  });

  it('meldt geen bijvBepTarget als de docent het label bijvoeglijke bepaling zelf weghaalt', () => {
    const s = alle.find(x => x.id === 3)!;
    const zonderBvb = opslaan(s, a => { a.subLabels = {}; });
    expect(getDroppedFields(s, zonderBvb).some(d => d.field === 'bijvBepTarget')).toBe(false);
  });
});
