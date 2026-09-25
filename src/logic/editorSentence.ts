import type { RoleKey, Sentence, Token } from '../types';
import { getBijzinTokenGroups } from './bijzinAnalysis';
import { BETREKKELIJKE_BIJZIN_LEVEL, isBijzinFunctieAsked } from './validation';

/**
 * The sentence editor keeps its own state: words, split points and labels per chunk or word.
 * These functions translate between that state and the tokens of a Sentence.
 */
export interface EditorAnnotation {
  words: string[];
  /** Index of the last word of a chunk (the editor splits after this word). */
  splitIndices: Set<number>;
  /** Main role per chunk, keyed by chunk index. */
  chunkLabels: Record<string, RoleKey>;
  /** Sub role per word, keyed by `w${wordIdx}`. */
  subLabels: Record<string, RoleKey>;
  /** Function of a bijzin, keyed by chunk index. */
  bijzinFunctieLabels: Record<string, RoleKey>;
  /** Word index a bijvoeglijke bijzin belongs to, keyed by chunk index. */
  bijvBepLinks: Record<string, number>;
}

export interface EditorChunk {
  words: string[];
  indices: number[];
}

export function getEditorChunks(words: string[], splitIndices: Set<number>): EditorChunk[] {
  const chunks: EditorChunk[] = [];
  let current: EditorChunk = { words: [], indices: [] };
  words.forEach((w, i) => {
    current.words.push(w);
    current.indices.push(i);
    if (splitIndices.has(i) || i === words.length - 1) {
      chunks.push(current);
      current = { words: [], indices: [] };
    }
  });
  return chunks;
}

function wordIdxFromTokenId(tokenId: string): number | undefined {
  // Token IDs follow the pattern s{id}t{wordIdx+1} (built-in) or c{id}t{wordIdx+1} (editor)
  const match = tokenId.match(/t(\d+)$/);
  return match ? parseInt(match[1], 10) - 1 : undefined;
}

/** Reconstruct the editor state from a stored sentence. */
export function editorAnnotationFromSentence(s: Sentence): EditorAnnotation {
  const splitIndices = new Set<number>();
  const chunkLabels: Record<string, RoleKey> = {};
  const subLabels: Record<string, RoleKey> = {};
  const bijzinFunctieLabels: Record<string, RoleKey> = {};
  const bijvBepLinks: Record<string, number> = {};
  let chunkIdx = 0;

  s.tokens.forEach((t, i) => {
    if (t.subRole) subLabels[`w${i}`] = t.subRole;
    const startsChunk = i === 0 || s.tokens[i - 1].role !== t.role || !!t.newChunk;
    if (!startsChunk) return;
    if (i > 0) {
      splitIndices.add(i - 1);
      chunkIdx++;
    }
    chunkLabels[chunkIdx] = t.role;
    if (t.bijzinFunctie) bijzinFunctieLabels[chunkIdx] = t.bijzinFunctie;
    if (t.bijvBepTarget) {
      const target = wordIdxFromTokenId(t.bijvBepTarget);
      if (target !== undefined) bijvBepLinks[chunkIdx] = target;
    }
  });

  return { words: s.tokens.map(t => t.text), splitIndices, chunkLabels, subLabels, bijzinFunctieLabels, bijvBepLinks };
}

/** Build the tokens of a sentence from the editor state. Token IDs are c{id}t{wordIdx+1}. */
export function buildEditorTokens(id: number, a: EditorAnnotation): Token[] {
  const tokens: Token[] = [];
  let prevRole: RoleKey | null = null;

  getEditorChunks(a.words, a.splitIndices).forEach((chunk, chunkIdx) => {
    const role = a.chunkLabels[chunkIdx];
    const bijzinFunc = a.bijzinFunctieLabels[chunkIdx];
    chunk.indices.forEach((wordIdx, i) => {
      const token: Token = {
        id: `c${id}t${wordIdx + 1}`,
        text: a.words[wordIdx],
        role: role,
      };
      const sub = a.subLabels[`w${wordIdx}`];
      if (sub) token.subRole = sub;
      if (i === 0 && bijzinFunc && role === 'bijzin') token.bijzinFunctie = bijzinFunc;
      if (i === 0 && role === 'bijzin' && bijzinFunc === 'bijv_bep' && a.bijvBepLinks[chunkIdx] !== undefined) {
        token.bijvBepTarget = `c${id}t${a.bijvBepLinks[chunkIdx] + 1}`;
      }
      if (i === 0 && prevRole === role && chunkIdx > 0) {
        token.newChunk = true;
      }
      tokens.push(token);
      prevRole = role;
    });
  });

  return tokens;
}

export interface CarryOverResult {
  tokens: Token[];
  /** Text of each annotated bijzin whose bijzinAnalyse could not be kept. */
  lostBijzinnen: string[];
}

/**
 * The editor rebuilds every token from words, splits and labels, so fields it has no controls for
 * would disappear on save. This carries the bijzinAnalyse of the source sentence over to the
 * rebuilt tokens, per word, as long as the bijzin keeps the same boundaries and the same words.
 * The bijzin is found by its words, not its position, so an edit elsewhere in the sentence keeps
 * the analysis. A bijvBepTarget must point inside the bijzin and is remapped to the new token ID.
 * A bijzin that cannot be kept is reported in lostBijzinnen, so the editor can warn instead of
 * dropping it silently.
 */
export function carryOverBijzinAnalyse(source: Sentence | null, tokens: Token[]): CarryOverResult {
  if (!source) return { tokens, lostBijzinnen: [] };

  const textOf = (group: Token[]) => group.map(t => t.text).join(' ');
  const rebuiltIdx = new Map(tokens.map((t, i) => [t.id, i]));
  const unmatched = getBijzinTokenGroups({ ...source, tokens });

  const result = tokens.map(t => ({ ...t }));
  const lostBijzinnen: string[] = [];

  for (const group of getBijzinTokenGroups(source)) {
    if (!group.some(t => t.bijzinAnalyse)) continue;
    const offsetOf = new Map(group.map((t, i) => [t.id, i]));
    const targetsInside = group.every(t => !t.bijzinAnalyse?.bijvBepTarget || offsetOf.has(t.bijzinAnalyse.bijvBepTarget));
    const matchAt = unmatched.findIndex(g => textOf(g) === textOf(group));
    if (!targetsInside || matchAt < 0) {
      lostBijzinnen.push(textOf(group));
      continue;
    }
    const start = rebuiltIdx.get(unmatched.splice(matchAt, 1)[0][0].id)!;
    group.forEach((t, i) => {
      if (!t.bijzinAnalyse) return;
      const analyse = { ...t.bijzinAnalyse };
      if (analyse.bijvBepTarget) analyse.bijvBepTarget = result[start + offsetOf.get(analyse.bijvBepTarget)!].id;
      result[start + i].bijzinAnalyse = analyse;
    });
  }

  return { tokens: result, lostBijzinnen };
}

/**
 * A betrekkelijke (bijvoeglijke) bijzin is only named and analysed on the highest level. Below that
 * level the editor warns the teacher: the student names the bijzin, but gets no function question.
 */
export function getBetrekkelijkeBijzinLevelWarning(bijzinFuncties: (RoleKey | undefined)[], level: number): string | null {
  if (!bijzinFuncties.includes('bijv_bep') || isBijzinFunctieAsked('bijv_bep', true, level)) return null;
  return `Betrekkelijke bijzin op niveau ${level}: de app vraagt hier geen functie van de betrekkelijke bijzin en laat de bijzin niet ontleden. Dat gebeurt pas vanaf niveau ${BETREKKELIJKE_BIJZIN_LEVEL}. De leerling benoemt de bijzin alleen als bijzin.`;
}
