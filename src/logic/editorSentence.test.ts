import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';
import { buildEditorTokens, carryOverBijzinAnalyse, editorAnnotationFromSentence, getBetrekkelijkeBijzinLevelWarning } from './editorSentence';
import { buildBijzinSentence, getBijzinTokenGroups } from './bijzinAnalysis';
import level3 from '../data/sentences-level-3.json';
import level4 from '../data/sentences-level-4.json';

const all = [...level3, ...level4] as Sentence[];
const byId = (id: number) => all.find(s => s.id === id)!;

/** Open a stored sentence in the editor, optionally change the editor state, and rebuild the tokens. */
function reopen(s: Sentence, change?: (a: ReturnType<typeof editorAnnotationFromSentence>) => void) {
  const annotation = editorAnnotationFromSentence(s);
  change?.(annotation);
  return carryOverBijzinAnalyse(s, buildEditorTokens(s.id, annotation));
}

describe('zinseditor — bijzinontleding bij opslaan', () => {
  it('bouwt zonder overdracht de tokens opnieuw op en verliest zo de bijzinontleding (zin 330)', () => {
    const tokens = buildEditorTokens(330, editorAnnotationFromSentence(byId(330)));
    expect(tokens.some(t => t.bijzinAnalyse)).toBe(false);
  });

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
    expect(carryOverBijzinAnalyse(null, tokens)).toEqual({ tokens, lostBijzinnen: [] });
  });
});

describe('zinseditor — betrekkelijke bijzin onder het hoogste niveau', () => {
  const tokens = byId(410).tokens;

  it('waarschuwt onder niveau 4', () => {
    expect(tokens.some(t => t.bijzinFunctie === 'bijv_bep')).toBe(true);
    expect(getBetrekkelijkeBijzinLevelWarning(tokens, 3)).toContain('geen functie van de betrekkelijke bijzin');
  });

  it('waarschuwt niet op niveau 4', () => {
    expect(getBetrekkelijkeBijzinLevelWarning(tokens, 4)).toBeNull();
  });

  it('waarschuwt niet bij een andere bijzin', () => {
    expect(getBetrekkelijkeBijzinLevelWarning(byId(330).tokens, 1)).toBeNull();
  });
});
