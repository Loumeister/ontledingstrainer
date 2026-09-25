import type { BijzinTokenAnalyse, RoleKey, Sentence, Token } from '../types';
import { getBijzinTokenGroups } from './bijzinAnalysis';
import { computeCorrectSplits } from './validation';

/**
 * Editor state for the analysis of one bijzin, following the same pattern as the main editor:
 * split points between words, a role per chunk, and a verbindingswoord mark per word.
 * Word indices are local to the bijzin.
 */
export interface BijzinEditState {
  /** Local index of the last word of a chunk. */
  splits: number[];
  /** Role per chunk, keyed by chunk index. */
  labels: Record<number, RoleKey>;
  /** Words marked as betrekkelijk of vragend verbindingswoord. */
  verbindingswoord: number[];
  /**
   * Fields the editor has no controls for (subRole, bijvBepTarget, alternativeRole), with the role
   * they belonged to. They are kept only while the word keeps that role.
   */
  kept: Record<number, Omit<BijzinTokenAnalyse, 'newChunk' | 'verbindingswoord'>>;
}

/** Identifies a bijzin by its position and words, so edits fall away when either changes. */
export function bijzinKey(sentenceTokens: Token[], group: Token[]): string {
  return `${sentenceTokens.indexOf(group[0])}:${group.map(t => t.text).join(' ')}`;
}

export function bijzinEditStateFromTokens(group: Token[]): BijzinEditState {
  if (!group.every(t => t.bijzinAnalyse)) {
    return { splits: [], labels: {}, verbindingswoord: [], kept: {} };
  }
  const analysed = group.map(t => ({ ...t, ...t.bijzinAnalyse! }));
  const splits = [...computeCorrectSplits(analysed)].sort((a, b) => a - b);
  const labels: Record<number, RoleKey> = {};
  const verbindingswoord: number[] = [];
  const kept: BijzinEditState['kept'] = {};
  let chunkIdx = 0;
  group.forEach((t, i) => {
    const { newChunk: _newChunk, verbindingswoord: isVerbinding, ...rest } = t.bijzinAnalyse!;
    if (i === 0 || splits.includes(i - 1)) {
      if (i > 0) chunkIdx++;
      labels[chunkIdx] = rest.role;
    }
    if (isVerbinding) verbindingswoord.push(i);
    if (rest.subRole || rest.bijvBepTarget || rest.alternativeRole) kept[i] = rest;
  });
  return { splits, labels, verbindingswoord, kept };
}

/** The chunks of the bijzin as lists of local word indices. */
export function bijzinEditChunks(state: BijzinEditState, wordCount: number): number[][] {
  const chunks: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < wordCount; i++) {
    current.push(i);
    if (state.splits.includes(i) || i === wordCount - 1) {
      chunks.push(current);
      current = [];
    }
  }
  return chunks;
}

/** Toggle a split after word i. Each new chunk keeps the role of the old chunk its first word was in. */
export function toggleBijzinEditSplit(state: BijzinEditState, i: number, wordCount: number): BijzinEditState {
  const oldChunks = bijzinEditChunks(state, wordCount);
  const splits = state.splits.includes(i) ? state.splits.filter(s => s !== i) : [...state.splits, i].sort((a, b) => a - b);
  const next = { ...state, splits };
  const labels: Record<number, RoleKey> = {};
  bijzinEditChunks(next, wordCount).forEach((chunk, idx) => {
    const oldIdx = oldChunks.findIndex(c => c.includes(chunk[0]));
    if (state.labels[oldIdx]) labels[idx] = state.labels[oldIdx];
  });
  return { ...next, labels };
}

export function setBijzinEditLabel(state: BijzinEditState, chunkIdx: number, role: RoleKey | null): BijzinEditState {
  const labels = { ...state.labels };
  if (role) labels[chunkIdx] = role; else delete labels[chunkIdx];
  return { ...state, labels };
}

export function toggleBijzinEditVerbindingswoord(state: BijzinEditState, i: number): BijzinEditState {
  const verbindingswoord = state.verbindingswoord.includes(i)
    ? state.verbindingswoord.filter(v => v !== i)
    : [...state.verbindingswoord, i].sort((a, b) => a - b);
  return { ...state, verbindingswoord };
}

/**
 * The bijzinAnalyse per word. Words in an unlabelled chunk get none, so a half-labelled bijzin
 * stays visible as such to getBijzinAnalyseProblems instead of being filled in silently.
 */
export function analysesFromBijzinEditState(state: BijzinEditState, wordCount: number): (BijzinTokenAnalyse | undefined)[] {
  const result: (BijzinTokenAnalyse | undefined)[] = new Array(wordCount).fill(undefined);
  let prevRole: RoleKey | undefined;
  bijzinEditChunks(state, wordCount).forEach((chunk, chunkIdx) => {
    const role = state.labels[chunkIdx];
    chunk.forEach((i, pos) => {
      if (!role) return;
      const kept = state.kept[i]?.role === role ? state.kept[i] : undefined;
      const analyse: BijzinTokenAnalyse = { ...kept, role };
      if (pos === 0 && chunkIdx > 0 && prevRole === role) analyse.newChunk = true;
      if (state.verbindingswoord.includes(i)) analyse.verbindingswoord = true;
      result[i] = analyse;
    });
    prevRole = role;
  });
  return result;
}

/** Replace the bijzinAnalyse of every bijzin that the teacher edited. */
export function applyBijzinEdits(sentence: Sentence, edits: Record<string, BijzinEditState>): Sentence {
  const tokens = sentence.tokens.map(t => ({ ...t }));
  const next = { ...sentence, tokens };
  for (const group of getBijzinTokenGroups(next)) {
    const state = edits[bijzinKey(tokens, group)];
    if (!state) continue;
    analysesFromBijzinEditState(state, group.length).forEach((analyse, i) => {
      if (analyse) group[i].bijzinAnalyse = analyse; else delete group[i].bijzinAnalyse;
    });
  }
  return next;
}

/**
 * A betrekkelijk of vragend verbindingswoord is no onderschikkend voegwoord: not in the main
 * sentence (subRole) and not in the bijzin (role). Same rule as the data test in sentenceData.test.ts.
 */
export function getVerbindingswoordWarnings(sentence: Sentence): string[] {
  return sentence.tokens
    .filter(t => t.bijzinAnalyse?.verbindingswoord && (t.subRole === 'vw_onder' || t.bijzinAnalyse.role === 'vw_onder'))
    .map(t => `'${t.text}' is een verbindingswoord en daarom geen onderschikkend voegwoord. Geef het in de bijzin zijn eigen functie (bijv. OW of LV) en haal in de hoofdzin het label onderschikkend voegwoord weg.`);
}

/**
 * Bijzinnen of the source sentence whose analysis is gone from the sentence that will be saved.
 * A source bijzin counts as kept when an analysed bijzin with the same words is still there (also
 * when it moved), or when an analysed bijzin now overlaps its old words (the teacher entered it
 * again after a change). Otherwise it is listed: a changed bijzin, a removed bijzin label or a
 * wiped analysis.
 */
export function getLostBijzinAnalyses(source: Sentence | null, sentence: Sentence): string[] {
  if (!source) return [];
  const textOf = (group: Token[]) => group.map(t => t.text).join(' ');
  const annotated = getBijzinTokenGroups(sentence).filter(g => g.some(t => t.bijzinAnalyse));
  const remaining = getBijzinTokenGroups(source).filter(g => g.some(t => t.bijzinAnalyse)).filter(group => {
    const same = annotated.findIndex(g => textOf(g) === textOf(group));
    if (same >= 0) annotated.splice(same, 1);
    return same < 0;
  });
  return remaining
    .filter(group => {
      const start = source.tokens.indexOf(group[0]);
      const end = start + group.length;
      return !annotated.some(g => {
        const gStart = sentence.tokens.indexOf(g[0]);
        return gStart < end && gStart + g.length > start;
      });
    })
    .map(textOf);
}
