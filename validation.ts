import { ROLES, FEEDBACK_MATRIX, FEEDBACK_STRUCTURE, FEEDBACK_SWAP, FEEDBACK_BIJZIN_FUNCTIE } from './constants';
import { Sentence, PlacementMap, RoleKey, Token, ValidationState } from './types';

export interface ChunkData {
  tokens: Token[];
  originalIndices: number[];
}

export interface ValidationResult {
  score: number;
  total: number;
  chunkStatus: Record<number, ValidationState>;
  chunkFeedback: Record<number, string>;
  isPerfect: boolean;
  bijzinWarningChunks: number[]; // Chunk indices with bijzin function warnings
}

/**
 * Build user chunks from tokens and split indices.
 * A split index marks the end of a chunk (inclusive).
 */
export function buildUserChunks(tokens: Token[], splitIndices: Set<number>): ChunkData[] {
  const chunks: ChunkData[] = [];
  let currentChunkTokens: Token[] = [];
  let currentChunkIndices: number[] = [];

  tokens.forEach((token, index) => {
    currentChunkTokens.push(token);
    currentChunkIndices.push(index);

    if (splitIndices.has(index) || index === tokens.length - 1) {
      chunks.push({
        tokens: currentChunkTokens,
        originalIndices: currentChunkIndices
      });
      currentChunkTokens = [];
      currentChunkIndices = [];
    }
  });
  return chunks;
}

/**
 * Count the real number of chunks in a sentence based on token roles and newChunk flags.
 */
export function countRealChunks(tokens: Token[]): number {
  let count = 0;
  tokens.forEach((t, i) => {
    if (i === 0 || t.role !== tokens[i - 1].role || t.newChunk) count++;
  });
  return count;
}

/**
 * Compute the correct split indices for a sentence.
 * A split index marks the end of a chunk (inclusive, between two different chunks).
 */
export function computeCorrectSplits(tokens: Token[]): Set<number> {
  const correctSplits = new Set<number>();
  tokens.forEach((t, i) => {
    const next = tokens[i + 1];
    if (next && (t.role !== next.role || next.newChunk)) correctSplits.add(i);
  });
  return correctSplits;
}

/**
 * Check whether a user-assigned role matches a token's role,
 * considering the primary role and any acceptable alternativeRole.
 */
export function roleMatchesToken(userLabel: RoleKey, token: Token): boolean {
  return userLabel === token.role || (token.alternativeRole !== undefined && userLabel === token.alternativeRole);
}

/**
 * Check whether all tokens in a chunk agree on the same effective role
 * (primary or alternative). Returns the agreed-upon role, or null if inconsistent.
 */
export function getConsistentRole(tokens: Token[]): RoleKey | null {
  if (tokens.length === 0) return null;
  const firstRole = tokens[0].role;

  // Check primary role consistency
  if (tokens.every(t => t.role === firstRole)) return firstRole;

  // Check if all tokens share a common alternativeRole
  const firstAlt = tokens[0].alternativeRole;
  if (firstAlt && tokens.every(t => t.alternativeRole === firstAlt)) return firstAlt;

  // Check if there's a mix but all tokens allow the first token's primary role
  if (tokens.every(t => t.role === firstRole || t.alternativeRole === firstRole)) return firstRole;

  // Check if all tokens allow the first token's alternativeRole
  if (firstAlt && tokens.every(t => t.role === firstAlt || t.alternativeRole === firstAlt)) return firstAlt;

  return null;
}

/**
 * Main validation function: checks user's splits and labels against the sentence data.
 * Supports bijzin function validation and bijvBep link validation.
 */
export function validateAnswer(
  sentence: Sentence,
  splitIndices: Set<number>,
  chunkLabels: PlacementMap,
  subLabels: PlacementMap,
  includeBB: boolean,
  bijzinFunctieLabels?: PlacementMap,
  bijvBepLinks?: Record<string, string>,
): { result: ValidationResult; mistakes: Record<string, number> } {
  const userChunks = buildUserChunks(sentence.tokens, splitIndices);
  const chunkStatus: Record<number, ValidationState> = {};
  const chunkFeedback: Record<number, string> = {};
  let correctChunksCount = 0;
  const currentMistakes: Record<string, number> = {};

  userChunks.forEach((chunk, idx) => {
    const chunkTokens = chunk.tokens;
    const firstTokenId = chunkTokens[0].id;
    const firstTokenRole = chunkTokens[0].role;
    const missedInternalSplit = chunkTokens.slice(1).some(t => t.newChunk);

    // Check role consistency considering alternative roles
    const consistentRole = getConsistentRole(chunkTokens);
    const isConsistentRole = consistentRole !== null;

    const lastTokenId = chunkTokens[chunkTokens.length - 1].id;
    const lastTokenIndex = sentence.tokens.findIndex(t => t.id === lastTokenId);
    const nextToken = sentence.tokens[lastTokenIndex + 1];

    // Split too early: next token shares a role with this chunk (primary or alt) and no newChunk
    const splitTooEarly = nextToken && !nextToken.newChunk &&
      consistentRole !== null && roleMatchesToken(consistentRole, nextToken);

    const firstTokenIndexInSent = sentence.tokens.findIndex(t => t.id === firstTokenId);
    const prevToken = sentence.tokens[firstTokenIndexInSent - 1];

    // Started too late: previous token shares a role with this chunk and no newChunk on first token
    const startedTooLate = prevToken && !chunkTokens[0].newChunk &&
      consistentRole !== null && roleMatchesToken(consistentRole, prevToken);

    const isValidSplit = isConsistentRole && !splitTooEarly && !startedTooLate && !missedInternalSplit;

    if (!isValidSplit) {
      chunkStatus[idx] = 'incorrect-split';
      if (!isConsistentRole || missedInternalSplit) chunkFeedback[idx] = FEEDBACK_STRUCTURE.INCONSISTENT;
      else if (splitTooEarly || startedTooLate) chunkFeedback[idx] = FEEDBACK_STRUCTURE.TOO_MANY_SPLITS;
      else chunkFeedback[idx] = FEEDBACK_STRUCTURE.MISSING_SPLIT;
      currentMistakes['Verdeling'] = (currentMistakes['Verdeling'] || 0) + 1;
    } else {
      let userLabel = chunkLabels[firstTokenId];
      // Safe: isValidSplit is true only when isConsistentRole is true, which means consistentRole !== null
      const effectiveRole = consistentRole!;

      // --- Sub-label promotion: when a student drops a role on a word instead of the chunk header ---
      // If the chunk has no main label, check if sub-labels match the expected chunk role.
      // Accept it when the token has no separate expected subRole (single role).
      // Give a nudge when the token has a different expected subRole (dual role).
      if (!userLabel) {
        const subLabelOnFirstToken = subLabels[firstTokenId] as RoleKey | undefined;
        const anyMatchingSubLabel = chunkTokens.find(t => {
          const sub = subLabels[t.id] as RoleKey | undefined;
          return sub && roleMatchesToken(sub, t);
        });

        if (subLabelOnFirstToken && roleMatchesToken(subLabelOnFirstToken, chunkTokens[0])) {
          // Student placed correct role on word instead of chunk header
          const hasDualRole = chunkTokens.some(t => {
            const expectedSub = (!includeBB && t.subRole === 'bijv_bep') ? undefined : t.subRole;
            return expectedSub && expectedSub !== t.role;
          });
          if (!hasDualRole) {
            // Single role: accept as correct
            userLabel = subLabelOnFirstToken;
          }
          // Dual role: fall through to normal validation which will show nudge
        } else if (anyMatchingSubLabel) {
          const sub = subLabels[anyMatchingSubLabel.id] as RoleKey;
          if (chunkTokens.every(t => roleMatchesToken(sub, t))) {
            const hasDualRole = chunkTokens.some(t => {
              const expectedSub = (!includeBB && t.subRole === 'bijv_bep') ? undefined : t.subRole;
              return expectedSub && expectedSub !== t.role;
            });
            if (!hasDualRole) {
              userLabel = sub;
            }
          }
        }
      }

      if (userLabel === effectiveRole) {
        chunkStatus[idx] = 'correct';
        correctChunksCount++;
      } else if (userLabel && chunkTokens.every(t => roleMatchesToken(userLabel!, t))) {
        // User chose an alternative role that all tokens accept
        chunkStatus[idx] = 'correct';
        correctChunksCount++;
      } else {
        const correctRoleName = ROLES.find(r => r.key === firstTokenRole)?.label || firstTokenRole;
        if (firstTokenRole === 'pv' && userLabel === 'wg') {
          chunkStatus[idx] = 'warning';
          chunkFeedback[idx] = FEEDBACK_MATRIX['wg'] && FEEDBACK_MATRIX['wg']['pv'] ? FEEDBACK_MATRIX['wg']['pv'] : "Dit hoort bij het gezegde.";
          currentMistakes[correctRoleName] = (currentMistakes[correctRoleName] || 0) + 1;
        } else if (!userLabel) {
          // No label assigned at all: give constructive feedback
          chunkStatus[idx] = 'incorrect-role';
          chunkFeedback[idx] = `Vergeet niet dit zinsdeel te benoemen. Sleep een label hiernaartoe – welk zinsdeel zou dit kunnen zijn?`;
          currentMistakes[correctRoleName] = (currentMistakes[correctRoleName] || 0) + 1;
        } else {
          chunkStatus[idx] = 'incorrect-role';
          if (FEEDBACK_MATRIX[userLabel] && FEEDBACK_MATRIX[userLabel][firstTokenRole]) {
            chunkFeedback[idx] = FEEDBACK_MATRIX[userLabel][firstTokenRole];
          } else {
            const userRoleName = ROLES.find(r => r.key === userLabel)?.label || userLabel;
            chunkFeedback[idx] = `Dit zinsdeel is niet het ${userRoleName}. Kijk nog eens goed – welk type zinsdeel past hier? Denk aan de vragen die je bij elk zinsdeel kunt stellen.`;
          }
          currentMistakes[correctRoleName] = (currentMistakes[correctRoleName] || 0) + 1;
        }
      }
    }
  });

  // --- Bijzin double-role detection: when a student labels a bijzin chunk with its function ---
  // E.g. they put "LV" on a chunk that should be "Bijzin" (with function LV).
  userChunks.forEach((chunk, idx) => {
    if (chunkStatus[idx] !== 'incorrect-role') return;
    const firstToken = chunk.tokens[0];
    const expectedFunctie = firstToken.bijzinFunctie;
    if (firstToken.role !== 'bijzin' || !expectedFunctie) return;
    // Skip bijv_bep function swap detection when includeBB is off
    if (expectedFunctie === 'bijv_bep' && !includeBB) return;
    const userLabel = chunkLabels[firstToken.id];
    if (userLabel === expectedFunctie) {
      const functieName = ROLES.find(r => r.key === expectedFunctie)?.label || expectedFunctie;
      chunkFeedback[idx] = FEEDBACK_SWAP.BIJZIN_HAS_FUNCTIE(functieName);
      chunkStatus[idx] = 'warning';
    }
  });

  // --- Bijzin function validation ---
  let bijzinFunctieMismatch = false;
  let bijvBepLinkMismatch = false;
  const bijzinWarningChunks: number[] = [];
  if (bijzinFunctieLabels) {
    userChunks.forEach((chunk, idx) => {
      const firstToken = chunk.tokens[0];
      const expectedFunctie = firstToken.bijzinFunctie;
      if (!expectedFunctie) return;
      // Skip bijv_bep function validation when includeBB is off
      if (expectedFunctie === 'bijv_bep' && !includeBB) return;
      const userLabel = chunkLabels[firstToken.id];
      if (userLabel !== 'bijzin') return;
      if (chunkStatus[idx] !== 'correct') return;

      const userFunctie = bijzinFunctieLabels[firstToken.id];
      if (userFunctie === expectedFunctie) {
        // For bijv_bep, also validate the target link
        if (expectedFunctie === 'bijv_bep' && firstToken.bijvBepTarget && bijvBepLinks) {
          const userTarget = bijvBepLinks[firstToken.id];
          if (userTarget !== firstToken.bijvBepTarget) {
            bijvBepLinkMismatch = true;
            bijzinWarningChunks.push(idx);
            if (!userTarget) {
              chunkFeedback[idx] = "Goed! Wijs nu het woord aan waar deze bijvoeglijke bijzin bij hoort. Welk woord wordt er nader bepaald?";
              chunkStatus[idx] = 'warning';
            } else {
              const expectedTarget = sentence.tokens.find(t => t.id === firstToken.bijvBepTarget);
              chunkFeedback[idx] = `Deze bijzin bepaalt het woord '${expectedTarget?.text || '?'}' nader, niet het woord dat je hebt gekozen. Welk woord krijgt een eigenschap?`;
              chunkStatus[idx] = 'warning';
            }
          }
        }
      } else {
        bijzinFunctieMismatch = true;
        bijzinWarningChunks.push(idx);
        if (!userFunctie) {
          chunkFeedback[idx] = FEEDBACK_BIJZIN_FUNCTIE.MISSING;
          chunkStatus[idx] = 'warning';
        } else {
          const expectedFunctieName = ROLES.find(r => r.key === expectedFunctie)?.label || expectedFunctie;
          chunkFeedback[idx] = FEEDBACK_BIJZIN_FUNCTIE.WRONG(expectedFunctieName);
          chunkStatus[idx] = 'warning';
        }
      }
    });
  }

  let subRoleMismatch = false;
  sentence.tokens.forEach(t => {
    const userSub = subLabels[t.id];
    let expectedSub = t.subRole;
    if (!includeBB && expectedSub === 'bijv_bep') expectedSub = undefined;
    if (userSub !== expectedSub) subRoleMismatch = true;
  });

  const isSplitPerfect = correctChunksCount === userChunks.length;
  const realChunkCount = countRealChunks(sentence.tokens);
  const isPerfect = isSplitPerfect && userChunks.length === realChunkCount && !subRoleMismatch && !bijzinFunctieMismatch && !bijvBepLinkMismatch;

  return {
    result: {
      score: correctChunksCount,
      total: userChunks.length,
      chunkStatus,
      chunkFeedback,
      isPerfect,
      bijzinWarningChunks,
    },
    mistakes: currentMistakes
  };
}
