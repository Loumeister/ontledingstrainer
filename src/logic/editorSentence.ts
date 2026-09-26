import type { DifficultyLevel, PredicateType, RoleKey, Sentence, Token } from '../types';
import { getBijzinTokenGroups } from './bijzinAnalysis';
import { BETREKKELIJKE_BIJZIN_LEVEL, isBijzinFunctieAsked } from './validation';
import { alignWords } from './wordAlignment';
import { applyBijzinEdits, type BijzinEditState } from './bijzinEditor';

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

/**
 * The editor rebuilds every token from words, splits and labels, so fields it has no controls for
 * would disappear on save. This carries the bijzinAnalyse of the source sentence over to the
 * rebuilt tokens, per word, as long as the bijzin keeps the same boundaries and the same words.
 * The bijzin is found by its words, not its position, so an edit elsewhere in the sentence keeps
 * the analysis. A bijvBepTarget must point inside the bijzin and is remapped to the new token ID.
 * Which analyses could not be kept is answered by getLostBijzinAnalyses (bijzinEditor.ts).
 */
export function carryOverBijzinAnalyse(source: Sentence | null, tokens: Token[]): Token[] {
  if (!source) return tokens;

  const textOf = (group: Token[]) => group.map(t => t.text).join(' ');
  const rebuiltIdx = new Map(tokens.map((t, i) => [t.id, i]));
  const unmatched = getBijzinTokenGroups({ ...source, tokens });

  const result = tokens.map(t => ({ ...t }));

  for (const group of getBijzinTokenGroups(source)) {
    if (!group.some(t => t.bijzinAnalyse)) continue;
    const offsetOf = new Map(group.map((t, i) => [t.id, i]));
    const targetsInside = group.every(t => !t.bijzinAnalyse?.bijvBepTarget || offsetOf.has(t.bijzinAnalyse.bijvBepTarget));
    const matchAt = unmatched.findIndex(g => textOf(g) === textOf(group));
    if (!targetsInside || matchAt < 0) continue;
    const start = rebuiltIdx.get(unmatched.splice(matchAt, 1)[0][0].id)!;
    group.forEach((t, i) => {
      if (!t.bijzinAnalyse) return;
      const analyse = { ...t.bijzinAnalyse };
      if (analyse.bijvBepTarget) analyse.bijvBepTarget = result[start + offsetOf.get(analyse.bijvBepTarget)!].id;
      result[start + i].bijzinAnalyse = analyse;
    });
  }

  return result;
}

/**
 * A betrekkelijke (bijvoeglijke) bijzin is only named and analysed on the highest level. Below that
 * level the editor warns the teacher: the student names the bijzin, but gets no function question.
 */
export function getBetrekkelijkeBijzinLevelWarning(bijzinFuncties: (RoleKey | undefined)[], level: number): string | null {
  if (!bijzinFuncties.includes('bijv_bep') || isBijzinFunctieAsked('bijv_bep', true, level)) return null;
  return `Betrekkelijke bijzin op niveau ${level}: de app vraagt hier geen functie van de betrekkelijke bijzin en laat de bijzin niet ontleden. Dat gebeurt pas vanaf niveau ${BETREKKELIJKE_BIJZIN_LEVEL}. De leerling benoemt de bijzin alleen als bijzin.`;
}

/** Token fields the editor sets itself: when one is missing after saving, the teacher removed it. */
const EDITOR_TOKEN_FIELDS = new Set(['id', 'text', 'role', 'subRole', 'newChunk', 'bijzinFunctie', 'bijzinAnalyse']);
/**
 * Sentence fields the teacher manages in the editor. owNumber and pvTense belong here even when
 * they are left out: "Automatisch" (null) is the teacher's choice to let the heuristic decide.
 */
const TEACHER_SENTENCE_FIELDS = new Set(['id', 'label', 'tokens', 'predicateType', 'level', 'owNumber', 'pvTense']);

const FIELD_LABELS: Record<string, string> = {
  bijvBepTarget: 'koppeling van een bijvoeglijke bepaling aan haar kernwoord',
  alternativeRole: 'alternatieve rol (tweede goedgekeurde lezing)',
  structuralTags: 'structuurlabels voor docenten',
};

export interface DroppedField {
  field: string;
  /** Dutch description for the teacher. */
  label: string;
  /** Words that lose the field; empty for a field of the whole sentence. */
  words: string[];
}

/**
 * Fields of the source sentence that the editor has no controls for and that are gone from the
 * sentence that will be saved. The bijzinAnalyse has its own check (getLostBijzinAnalyses).
 * Words are aligned first; a word the teacher changed is not compared. A bijvBepTarget only counts
 * while the word keeps its sub role, and not on a bijzin, whose link the editor sets itself.
 */
export function getDroppedFields(source: Sentence | null, sentence: Sentence): DroppedField[] {
  if (!source) return [];
  const words = new Map<string, string[]>();
  const add = (field: string, word?: string) => {
    const list = words.get(field) ?? [];
    if (word !== undefined) list.push(word);
    words.set(field, list);
  };

  const toNew = alignWords(source.tokens.map(t => t.text), sentence.tokens.map(t => t.text));
  source.tokens.forEach((t, i) => {
    const j = toNew.get(i);
    if (j === undefined) return;
    const kept = sentence.tokens[j];
    for (const field of Object.keys(t)) {
      if (EDITOR_TOKEN_FIELDS.has(field) || field in kept) continue;
      if (field === 'bijvBepTarget' && (t.role === 'bijzin' || kept.subRole !== t.subRole)) continue;
      add(field, t.text);
    }
  });
  for (const field of Object.keys(source)) {
    if (!TEACHER_SENTENCE_FIELDS.has(field) && !(field in sentence)) add(field);
  }

  return [...words].map(([field, list]) => ({ field, label: FIELD_LABELS[field] ?? `ander veld (${field})`, words: list }));
}

const sortedEntries = (r: Record<string, unknown>) =>
  Object.entries(r).map(([k, v]) => [String(k), v] as const).sort(([a], [b]) => a.localeCompare(b));

/** Whether the editor state describes exactly the words, chunks and labels of the source sentence. */
export function isAnnotationUnchanged(source: Sentence, a: EditorAnnotation): boolean {
  const key = (x: EditorAnnotation) => JSON.stringify([
    x.words,
    [...x.splitIndices].sort((p, q) => p - q),
    sortedEntries(x.chunkLabels),
    sortedEntries(x.subLabels),
    sortedEntries(x.bijzinFunctieLabels),
    sortedEntries(x.bijvBepLinks),
  ]);
  return key(a) === key(editorAnnotationFromSentence(source));
}

export interface EditorSentenceInput {
  id: number;
  label: string;
  predicateType: PredicateType;
  level: DifficultyLevel;
  /** null = "Automatisch": left out, so the heuristic decides. */
  owNumber: 'sg' | 'pl' | null;
  pvTense: 'present' | 'past' | null;
  annotation: EditorAnnotation;
  /** The stored sentence being edited, or null for a new sentence. */
  source: Sentence | null;
  bijzinEdits: Record<string, BijzinEditState>;
}

/**
 * The sentence the editor saves. When the words, chunks and labels are those of the source, the
 * source tokens and its other sentence fields are kept as they are, so nothing the editor cannot
 * show gets lost and token IDs stay the same. Otherwise the tokens are rebuilt from the editor
 * state and only the bijzinAnalyse is carried over; getDroppedFields reports what else falls away.
 */
export function buildEditorSentence(input: EditorSentenceInput): Sentence {
  const { id, source, annotation } = input;
  const unchanged = source !== null && isAnnotationUnchanged(source, annotation);
  const tokens = unchanged
    ? source.tokens.map(t => ({ ...t }))
    : carryOverBijzinAnalyse(source, buildEditorTokens(id, annotation));
  const kept = unchanged
    ? Object.fromEntries(Object.entries(source).filter(([field]) => !TEACHER_SENTENCE_FIELDS.has(field)))
    : {};

  const sentence: Sentence = { ...kept, id, label: input.label, predicateType: input.predicateType, level: input.level, tokens };
  if (input.owNumber !== null) sentence.owNumber = input.owNumber;
  if (input.pvTense !== null) sentence.pvTense = input.pvTense;
  return applyBijzinEdits(sentence, input.bijzinEdits);
}
