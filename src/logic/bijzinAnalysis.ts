import { PlacementMap, Sentence, Token } from '../types';
import { BETREKKELIJKE_BIJZIN_LEVEL, buildUserChunks, computeCorrectSplits, isBijzinFunctieAsked } from './validation';

/** The bijzinnen of a sentence as token groups, following the same chunk rules as the main analysis. */
export function getBijzinTokenGroups(sentence: Sentence): Token[][] {
  const groups = buildUserChunks(sentence.tokens, computeCorrectSplits(sentence.tokens)).map(c => c.tokens);
  return groups.filter(g => g[0].role === 'bijzin');
}

/**
 * Derive the bijzin as a sentence of its own, so it can be split, labelled and checked with
 * validateAnswer like any other sentence. Returns null when the bijzin is not (fully) annotated.
 * Tokens marked notAsked are left out: the student does not label them.
 */
export function buildBijzinSentence(sentence: Sentence, bijzinTokens: Token[]): Sentence | null {
  if (bijzinTokens.length === 0 || bijzinTokens.some(t => t.role !== 'bijzin' || !t.bijzinAnalyse)) return null;
  const tokens: Token[] = bijzinTokens
    .filter(t => !t.bijzinAnalyse!.notAsked)
    .map(t => {
      const { notAsked: _notAsked, ...analyse } = t.bijzinAnalyse!;
      return { id: t.id, text: t.text, ...analyse };
    });
  if (tokens.length === 0) return null;
  return {
    id: sentence.id,
    label: `${sentence.label} (bijzin)`,
    level: sentence.level,
    predicateType: tokens.some(t => t.role === 'ng') ? 'NG' : 'WG',
    tokens,
  };
}

/** A betrekkelijke (bijvoeglijke) bijzin is only analysed on the highest level, like its function. */
export function isBijzinAnalyseAsked(sentence: Sentence, bijzinTokens: Token[]): boolean {
  return bijzinTokens[0]?.bijzinFunctie !== 'bijv_bep' || sentence.level >= BETREKKELIJKE_BIJZIN_LEVEL;
}

/**
 * The bijzin opens for its own analysis once the student has labelled every chunk of the main
 * sentence and has this bijzin itself right: exact boundaries, the label 'bijzin' and — when it is
 * asked — its function. Errors elsewhere in the main sentence do not block it.
 */
export function isBijzinUnlocked(
  sentence: Sentence,
  bijzinTokens: Token[],
  splitIndices: Set<number>,
  chunkLabels: PlacementMap,
  bijzinFunctieLabels: PlacementMap,
  includeBB: boolean,
): boolean {
  const userChunks = buildUserChunks(sentence.tokens, splitIndices);
  if (!userChunks.every(c => !!chunkLabels[c.tokens[0].id])) return false;

  const ids = bijzinTokens.map(t => t.id);
  const match = userChunks.find(c => c.tokens.length === ids.length && c.tokens.every((t, i) => t.id === ids[i]));
  if (!match || chunkLabels[ids[0]] !== 'bijzin') return false;

  const functie = bijzinTokens[0].bijzinFunctie;
  return !isBijzinFunctieAsked(functie, includeBB, sentence.level) || bijzinFunctieLabels[ids[0]] === functie;
}
