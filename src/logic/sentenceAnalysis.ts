/**
 * sentenceAnalysis.ts — Pure functions for comparing expected vs student sentence parsing.
 *
 * No side effects, no React, no localStorage. All data passed as parameters.
 *
 * Key concepts:
 * - Expected chunks: derived from Sentence.tokens (role + newChunk flags)
 * - Student chunks: derived from sols entry (sp[] split indices + lb{} labels)
 * - Comparison walks tokens left-to-right, detecting split and label mismatches
 */

import type { Sentence, Token } from '../types';
import { ROLES } from '../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChunkInfo {
  tokens: Array<{ id: string; text: string; index: number }>;
  role: string | null;
  roleLabel: string | null;
  startIndex: number;
}

export type ErrorType = 'correct' | 'groepering' | 'benoeming' | 'both';

export interface TokenComparison {
  tokenIndex: number;
  tokenId: string;
  tokenText: string;
  /** Whether this token starts a new chunk in expected */
  expectedChunkStart: boolean;
  /** Whether this token starts a new chunk in student answer */
  studentChunkStart: boolean;
  /** Expected role for this token's chunk */
  expectedRole: string;
  /** Student-assigned role for this token's chunk (null if unlabeled) */
  studentRole: string | null;
  /** Does the split boundary match? */
  splitMatch: boolean;
  /** Does the role label match? (includes alternativeRole) */
  labelMatch: boolean;
  /** Is this the first divergence point? */
  isFirstDivergence: boolean;
  /** Classified error type */
  errorType: ErrorType;
}

export interface SentenceComparisonResult {
  sentenceId: number;
  expectedChunks: ChunkInfo[];
  studentChunks: ChunkInfo[];
  tokenComparisons: TokenComparison[];
  firstDivergenceIndex: number | null;
  summary: {
    splitErrors: number;
    labelErrors: number;
    correct: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoleLabel(key: string): string | null {
  const role = ROLES.find(r => r.key === key);
  return role ? role.shortLabel : key.toUpperCase();
}

function roleMatches(studentRole: string, token: Token): boolean {
  if (studentRole === token.role) return true;
  if (token.alternativeRole && studentRole === token.alternativeRole) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Build expected chunks from Sentence.tokens
// ---------------------------------------------------------------------------

export function buildExpectedChunks(sentence: Sentence): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  let currentChunk: ChunkInfo | null = null;

  for (let i = 0; i < sentence.tokens.length; i++) {
    const token = sentence.tokens[i];
    const isNewChunk =
      i === 0 ||
      token.newChunk === true ||
      token.role !== sentence.tokens[i - 1].role;

    if (isNewChunk) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = {
        tokens: [{ id: token.id, text: token.text, index: i }],
        role: token.role,
        roleLabel: getRoleLabel(token.role),
        startIndex: i,
      };
    } else {
      currentChunk!.tokens.push({ id: token.id, text: token.text, index: i });
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

// ---------------------------------------------------------------------------
// Build student chunks from sols entry
// ---------------------------------------------------------------------------

export function buildStudentChunks(
  sentence: Sentence,
  sol: { sp: number[]; lb: Record<string, string> },
): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  const splitSet = new Set(sol.sp);
  let currentChunk: ChunkInfo | null = null;

  for (let i = 0; i < sentence.tokens.length; i++) {
    const token = sentence.tokens[i];
    const isNewChunk = i === 0 || splitSet.has(i);

    if (isNewChunk) {
      if (currentChunk) chunks.push(currentChunk);
      const assignedRole = sol.lb[token.id] || null;
      currentChunk = {
        tokens: [{ id: token.id, text: token.text, index: i }],
        role: assignedRole,
        roleLabel: assignedRole ? getRoleLabel(assignedRole) : null,
        startIndex: i,
      };
    } else {
      currentChunk!.tokens.push({ id: token.id, text: token.text, index: i });
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

// ---------------------------------------------------------------------------
// Compare expected vs student
// ---------------------------------------------------------------------------

export function compareSentence(
  sentence: Sentence,
  sol: { sp: number[]; lb: Record<string, string> },
): SentenceComparisonResult {
  const expectedChunks = buildExpectedChunks(sentence);
  const studentChunks = buildStudentChunks(sentence, sol);

  // Build per-token comparison data
  const tokenComparisons: TokenComparison[] = [];
  let firstDivergenceIndex: number | null = null;

  // Map: for each token index, which expected chunk does it belong to?
  const expectedChunkForToken: string[] = []; // role per token
  const expectedStartForToken: boolean[] = [];
  for (const chunk of expectedChunks) {
    for (const t of chunk.tokens) {
      expectedChunkForToken[t.index] = chunk.role || '';
      expectedStartForToken[t.index] = t.index === chunk.startIndex;
    }
  }

  // Map: for each token index, which student chunk / role?
  const studentRoleForToken: (string | null)[] = [];
  const studentStartForToken: boolean[] = [];
  for (const chunk of studentChunks) {
    for (const t of chunk.tokens) {
      studentRoleForToken[t.index] = chunk.role;
      studentStartForToken[t.index] = t.index === chunk.startIndex;
    }
  }

  let splitErrors = 0;
  let labelErrors = 0;
  let correct = 0;
  let boundaryPoints = 0;

  for (let i = 0; i < sentence.tokens.length; i++) {
    const token = sentence.tokens[i];
    const expectedStart = expectedStartForToken[i] ?? (i === 0);
    const studentStart = studentStartForToken[i] ?? (i === 0);
    const expectedRole = expectedChunkForToken[i] ?? token.role;
    const studentRole = studentRoleForToken[i] ?? null;

    // Only check split/label at chunk boundaries (first token of a chunk)
    // For non-boundary tokens, inherit the chunk's correctness
    const splitMatch = expectedStart === studentStart;
    const labelMatch = studentRole !== null && roleMatches(studentRole, token);

    let errorType: ErrorType = 'correct';
    if (!splitMatch && !labelMatch) {
      errorType = 'both';
    } else if (!splitMatch) {
      errorType = 'groepering';
    } else if (!labelMatch) {
      errorType = 'benoeming';
    }

    // Count errors only at chunk boundary positions (union of expected + student)
    if (expectedStart || studentStart) {
      boundaryPoints++;
      if (!splitMatch) splitErrors++;
      if (!labelMatch) labelErrors++;
      if (splitMatch && labelMatch) correct++;
    }

    const isFirstDiv = errorType !== 'correct' && firstDivergenceIndex === null;
    if (isFirstDiv) firstDivergenceIndex = i;

    tokenComparisons.push({
      tokenIndex: i,
      tokenId: token.id,
      tokenText: token.text,
      expectedChunkStart: expectedStart,
      studentChunkStart: studentStart,
      expectedRole,
      studentRole,
      splitMatch,
      labelMatch,
      isFirstDivergence: isFirstDiv,
      errorType,
    });
  }

  return {
    sentenceId: sentence.id,
    expectedChunks,
    studentChunks,
    tokenComparisons,
    firstDivergenceIndex,
    summary: {
      splitErrors,
      labelErrors,
      correct,
      total: boundaryPoints,
    },
  };
}

// ---------------------------------------------------------------------------
// Aggregate: students with recurring errors across sessions
// ---------------------------------------------------------------------------

export interface RecurringErrorInfo {
  studentName: string;
  recurringRoles: string[];
}

/**
 * Count students who have the same role error in 2+ separate sessions.
 */
export function computeRecurringErrorStudents(
  reports: Array<{ name: string; err: Record<string, number>; ts: string }>,
  threshold: number = 2,
): RecurringErrorInfo[] {
  // Group reports by student name (lowercase)
  const byStudent = new Map<string, Array<{ err: Record<string, number>; ts: string }>>();
  for (const r of reports) {
    const key = r.name.toLowerCase();
    if (!byStudent.has(key)) byStudent.set(key, []);
    byStudent.get(key)!.push(r);
  }

  const result: RecurringErrorInfo[] = [];
  for (const [name, sessions] of byStudent) {
    if (sessions.length < threshold) continue;
    // Count in how many sessions each role error appears
    const roleSessionCount = new Map<string, number>();
    for (const sess of sessions) {
      for (const role of Object.keys(sess.err)) {
        if (sess.err[role] > 0) {
          roleSessionCount.set(role, (roleSessionCount.get(role) || 0) + 1);
        }
      }
    }
    const recurring = [...roleSessionCount.entries()]
      .filter(([, count]) => count >= threshold)
      .map(([role]) => role);
    if (recurring.length > 0) {
      result.push({ studentName: name, recurringRoles: recurring });
    }
  }
  return result;
}
