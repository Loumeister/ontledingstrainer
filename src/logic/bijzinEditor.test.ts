import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';
import {
  analysesFromBijzinEditState,
  applyBijzinEdits,
  bijzinEditStateFromTokens,
  bijzinKey,
  getLostBijzinAnalyses,
  getVerbindingswoordWarnings,
  setBijzinEditLabel,
  toggleBijzinEditSplit,
  toggleBijzinEditVerbindingswoord,
} from './bijzinEditor';
import { buildEditorTokens, carryOverBijzinAnalyse, editorAnnotationFromSentence } from './editorSentence';
import { buildBijzinSentence, getBijzinAnalyseProblems, getBijzinTokenGroups } from './bijzinAnalysis';
import level3 from '../data/sentences-level-3.json';
import level4 from '../data/sentences-level-4.json';

const all = [...level3, ...level4] as Sentence[];
const byId = (id: number) => all.find(s => s.id === id)!;

/** Zin 330 zonder bijzinontleding, zoals een docent hem nieuw invoert. */
const kaal330: Sentence = { ...byId(330), tokens: byId(330).tokens.map(({ bijzinAnalyse: _a, ...t }) => t) };

describe('bijzineditor', () => {
  it('geeft voor elke ingebouwde bijzin precies de opgeslagen ontleding terug', () => {
    for (const s of all) {
      for (const group of getBijzinTokenGroups(s)) {
        const state = bijzinEditStateFromTokens(group);
        expect(analysesFromBijzinEditState(state, group.length), `zin ${s.id}`).toEqual(group.map(t => t.bijzinAnalyse));
      }
    }
  });

  it('laat een docent zin 330 knippen en benoemen, met dezelfde uitkomst als de ingebouwde zin', () => {
    const group = getBijzinTokenGroups(kaal330)[0];
    let state = bijzinEditStateFromTokens(group);
    for (const i of [0, 1, 2]) state = toggleBijzinEditSplit(state, i, group.length);
    (['vw_onder', 'ow', 'bwb', 'pv'] as const).forEach((role, idx) => { state = setBijzinEditLabel(state, idx, role); });
    const edited = applyBijzinEdits(kaal330, { [bijzinKey(kaal330.tokens, group)]: state });
    expect(edited.tokens.map(t => t.bijzinAnalyse)).toEqual(byId(330).tokens.map(t => t.bijzinAnalyse));
    expect(getBijzinAnalyseProblems(edited)).toEqual([]);
  });

  it('laat een half benoemde bijzin half ontleed, zodat de controle hem meldt', () => {
    const group = getBijzinTokenGroups(kaal330)[0];
    let state = toggleBijzinEditSplit(bijzinEditStateFromTokens(group), 0, group.length);
    state = setBijzinEditLabel(state, 0, 'vw_onder');
    const edited = applyBijzinEdits(kaal330, { [bijzinKey(kaal330.tokens, group)]: state });
    expect(getBijzinAnalyseProblems(edited)[0]).toContain('voor een deel ontleed');
  });

  it('houdt bij knippen de rol van het deel waar het eerste woord in zat', () => {
    const group = getBijzinTokenGroups(kaal330)[0];
    let state = setBijzinEditLabel(bijzinEditStateFromTokens(group), 0, 'bwb');
    state = toggleBijzinEditSplit(state, 0, group.length);
    expect(state.labels).toEqual({ 0: 'bwb', 1: 'bwb' });
    expect(analysesFromBijzinEditState(state, group.length)[1]).toEqual({ role: 'bwb', newChunk: true });
  });

  it('markeert een verbindingswoord en laat het de leerling onder niveau 4 niet benoemen', () => {
    const s = byId(410);
    const group = getBijzinTokenGroups(s)[0];
    const state = bijzinEditStateFromTokens(group);
    const vwIdx = state.verbindingswoord[0];
    expect(vwIdx).toBeDefined();
    const zonder = applyBijzinEdits(s, { [bijzinKey(s.tokens, group)]: toggleBijzinEditVerbindingswoord(state, vwIdx) });
    const zonderGroup = getBijzinTokenGroups(zonder)[0];
    expect(zonderGroup[vwIdx].bijzinAnalyse?.verbindingswoord).toBeUndefined();
    const laag = { ...s, level: 3 as const };
    expect(buildBijzinSentence(laag, getBijzinTokenGroups(laag)[0])!.tokens.map(t => t.id)).not.toContain(group[vwIdx].id);
  });

  it('bewaart subRole alleen zolang het woord zijn rol houdt', () => {
    const s = byId(405);
    const group = getBijzinTokenGroups(s)[0];
    const state = bijzinEditStateFromTokens(group);
    const [idx] = Object.keys(state.kept).map(Number);
    expect(idx).toBeDefined();
    const chunkIdx = [...state.splits, group.length].findIndex(end => idx <= end);
    const changed = setBijzinEditLabel(state, chunkIdx, 'mv');
    expect(analysesFromBijzinEditState(changed, group.length)[idx]).not.toHaveProperty('bijvBepTarget');
  });

  it('waarschuwt als een verbindingswoord onderschikkend voegwoord heet', () => {
    const s = byId(410);
    expect(getVerbindingswoordWarnings(s)).toEqual([]);
    const fout = { ...s, tokens: s.tokens.map(t => t.bijzinAnalyse?.verbindingswoord ? { ...t, subRole: 'vw_onder' as const } : t) };
    expect(getVerbindingswoordWarnings(fout)).toHaveLength(1);
  });

  describe('vervallen bijzinontleding', () => {
    const zin330 = byId(330);
    const opslaan = (change: (a: ReturnType<typeof editorAnnotationFromSentence>) => void) => {
      const a = editorAnnotationFromSentence(zin330);
      change(a);
      return { ...zin330, tokens: carryOverBijzinAnalyse(zin330, buildEditorTokens(330, a)).tokens };
    };

    it('meldt niets als de ontleding blijft staan', () => {
      expect(getLostBijzinAnalyses(zin330, opslaan(() => {}))).toEqual([]);
    });

    it('meldt niets als de bijzin alleen verschuift', () => {
      const verschoven = opslaan(a => {
        a.words.splice(2, 0, 'lekker');
        a.splitIndices = new Set([0, 1, 3]);
        a.chunkLabels = { 0: 'ow', 1: 'pv', 2: 'bwb', 3: 'bijzin' };
        a.bijzinFunctieLabels = { 3: 'bwb' };
      });
      expect(getLostBijzinAnalyses(zin330, verschoven)).toEqual([]);
    });

    it('meldt de bijzin als het bijzinlabel wordt weggehaald, ook zonder andere bijzin in de zin', () => {
      const zonderBijzin = opslaan(a => { a.chunkLabels[3] = 'bwb'; delete a.bijzinFunctieLabels[3]; });
      expect(getBijzinTokenGroups(zonderBijzin)).toEqual([]);
      expect(getLostBijzinAnalyses(zin330, zonderBijzin)).toEqual(['omdat het hard regende.']);
    });

    it('meldt de bijzin niet als hij verschoven én opnieuw ontleed is', () => {
      const beide = opslaan(a => {
        // "Gisteren na de les bleven wij binnen omdat het zacht regende."
        a.words = ['Gisteren', 'na', 'de', 'les', 'bleven', 'wij', 'binnen', 'omdat', 'het', 'zacht', 'regende.'];
        a.splitIndices = new Set([0, 3, 4, 5, 6]);
        a.chunkLabels = { 0: 'bwb', 1: 'bwb', 2: 'pv', 3: 'ow', 4: 'bwb', 5: 'bijzin' };
        a.bijzinFunctieLabels = { 5: 'bwb' };
      });
      const group = getBijzinTokenGroups(beide)[0];
      expect(group.map(t => t.text)).toEqual(['omdat', 'het', 'zacht', 'regende.']);
      let state = bijzinEditStateFromTokens(group);
      for (const i of [0, 1, 2]) state = toggleBijzinEditSplit(state, i, group.length);
      (['vw_onder', 'ow', 'bwb', 'pv'] as const).forEach((role, idx) => { state = setBijzinEditLabel(state, idx, role); });
      expect(getLostBijzinAnalyses(zin330, beide)).toEqual(['omdat het hard regende.']);
      const opnieuw = applyBijzinEdits(beide, { [bijzinKey(beide.tokens, group)]: state });
      expect(getLostBijzinAnalyses(zin330, opnieuw)).toEqual([]);
    });

    it('meldt de bijzin niet meer als de docent hem opnieuw heeft ontleed', () => {
      const gewijzigd = opslaan(a => { a.words[5] = 'zacht'; });
      const group = getBijzinTokenGroups(gewijzigd)[0];
      let state = bijzinEditStateFromTokens(group);
      for (const i of [0, 1, 2]) state = toggleBijzinEditSplit(state, i, group.length);
      (['vw_onder', 'ow', 'bwb', 'pv'] as const).forEach((role, idx) => { state = setBijzinEditLabel(state, idx, role); });
      expect(getLostBijzinAnalyses(zin330, gewijzigd)).toEqual(['omdat het hard regende.']);
      const opnieuw = applyBijzinEdits(gewijzigd, { [bijzinKey(gewijzigd.tokens, group)]: state });
      expect(getLostBijzinAnalyses(zin330, opnieuw)).toEqual([]);
    });
  });
});
