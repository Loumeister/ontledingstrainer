/**
 * SentenceComparison — Dual-strip visual comparison of expected vs student answer.
 *
 * Shows two horizontal token strips:
 *   "Verwacht"  — expected chunks with correct role labels
 *   "Leerling"  — student chunks with their labels, color-coded by error type
 *
 * Color coding:
 *   green  = correct (split + label match)
 *   orange = wrong label (benoeming), right split
 *   red    = wrong split (groepering) or both
 *   gold left border = first divergence point
 */
import React from 'react';
import type { SentenceComparisonResult, ChunkInfo } from '../../logic/sentenceAnalysis';
import { ROLES } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoleColor(roleKey: string): string {
  const role = ROLES.find(r => r.key === roleKey);
  return role?.colorClass ?? 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200';
}

function getRoleShortLabel(roleKey: string): string {
  const role = ROLES.find(r => r.key === roleKey);
  return role?.shortLabel ?? roleKey.toUpperCase();
}

// ---------------------------------------------------------------------------
// ChunkStrip — renders a row of chunks
// ---------------------------------------------------------------------------

interface ChunkStripProps {
  chunks: ChunkInfo[];
  label: string;
  variant: 'expected' | 'student';
  /** Token indices where the first divergence starts (for student strip highlighting) */
  firstDivergenceStart?: number;
}

const ChunkStrip: React.FC<ChunkStripProps> = ({ chunks, label, variant, firstDivergenceStart }) => (
  <div className="flex items-start gap-1 mb-1">
    <span className="text-[9px] text-slate-400 dark:text-slate-500 w-14 shrink-0 pt-1 font-medium uppercase tracking-wide">
      {label}
    </span>
    <div className="flex flex-wrap items-end gap-0.5">
      {chunks.map((chunk, ci) => {
        const isFirstDiv = firstDivergenceStart != null && chunk.startIndex === firstDivergenceStart;
        const roleKey = chunk.role;
        let bgClass: string;

        if (variant === 'expected') {
          bgClass = roleKey ? getRoleColor(roleKey) : 'bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300';
        } else {
          bgClass = 'bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300';
        }

        return (
          <React.Fragment key={ci}>
            {ci > 0 && (
              <span className="text-slate-300 dark:text-slate-600 text-[10px] select-none mx-0.5">|</span>
            )}
            <span
              className={`inline-flex items-baseline gap-0.5 text-[11px] px-1.5 py-0.5 rounded ${bgClass} ${
                isFirstDiv ? 'border-l-[3px] border-amber-400 dark:border-amber-500' : ''
              }`}
            >
              {chunk.tokens.map(t => t.text).join(' ')}
              {roleKey && (
                <span className="text-[9px] opacity-70 font-medium ml-0.5">
                  [{getRoleShortLabel(roleKey)}]
                </span>
              )}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// SentenceComparison — main component
// ---------------------------------------------------------------------------

interface SentenceComparisonProps {
  comparison: SentenceComparisonResult;
  sentenceLabel?: string;
  isPerfect?: boolean;
}

export const SentenceComparison: React.FC<SentenceComparisonProps> = ({
  comparison,
  sentenceLabel,
  isPerfect,
}) => {
  const { expectedChunks, studentChunks, tokenComparisons, firstDivergenceIndex, summary } = comparison;

  // Build student chunks with error coloring and expected role info
  const coloredStudentChunks: Array<ChunkInfo & { errorClass: string; expectedRole: string | null }> = studentChunks.map(chunk => {
    // Check all tokens in this chunk for errors
    const chunkTokens = tokenComparisons.filter(
      tc => tc.tokenIndex >= chunk.startIndex &&
            tc.tokenIndex < chunk.startIndex + chunk.tokens.length
    );
    const startToken = chunkTokens.find(tc => tc.studentChunkStart);
    let errorClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200';
    let expectedRole: string | null = null;

    if (startToken) {
      if (startToken.errorType === 'groepering' || startToken.errorType === 'both') {
        errorClass = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
        expectedRole = startToken.expectedRole;
      } else if (startToken.errorType === 'benoeming') {
        errorClass = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
        expectedRole = startToken.expectedRole;
      }
    } else {
      // Non-start token inherited — check if chunk has any wrong tokens
      const hasError = chunkTokens.some(tc => tc.errorType !== 'correct');
      if (hasError) {
        errorClass = 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      }
    }

    return { ...chunk, errorClass, expectedRole };
  });

  return (
    <div className={`rounded-lg p-2.5 border ${
      isPerfect
        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
    }`}>
      {sentenceLabel && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate">
            {sentenceLabel.replace(/^Zin \d+:\s*/, '')}
          </span>
          {isPerfect != null && (
            <span className="ml-auto text-[10px]">{isPerfect ? '✅' : '❌'}</span>
          )}
        </div>
      )}

      {/* Expected strip */}
      <ChunkStrip
        chunks={expectedChunks}
        label="Verwacht"
        variant="expected"
      />

      {/* Student strip */}
      <div className="flex items-start gap-1 mb-1">
        <span className="text-[9px] text-slate-400 dark:text-slate-500 w-14 shrink-0 pt-1 font-medium uppercase tracking-wide">
          Leerling
        </span>
        <div className="flex flex-wrap items-end gap-0.5">
          {coloredStudentChunks.map((chunk, ci) => {
            const isFirstDiv = firstDivergenceIndex != null && chunk.startIndex === firstDivergenceIndex;
            return (
              <React.Fragment key={ci}>
                {ci > 0 && (
                  <span className="text-slate-300 dark:text-slate-600 text-[10px] select-none mx-0.5">|</span>
                )}
                <span
                  className={`inline-flex items-baseline gap-0.5 text-[11px] px-1.5 py-0.5 rounded ${chunk.errorClass} ${
                    isFirstDiv ? 'border-l-[3px] border-amber-400 dark:border-amber-500' : ''
                  }`}
                >
                  {chunk.tokens.map(t => t.text).join(' ')}
                  {chunk.role && (
                    <span className="text-[9px] opacity-70 font-medium ml-0.5">
                      [{getRoleShortLabel(chunk.role)}]
                    </span>
                  )}
                  {chunk.expectedRole && chunk.role && chunk.expectedRole !== chunk.role && (
                    <span className="text-[8px] opacity-60 ml-0.5" title={`Verwacht: ${getRoleShortLabel(chunk.expectedRole)}`}>
                      (was {getRoleShortLabel(chunk.expectedRole)})
                    </span>
                  )}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error summary badges */}
      {!isPerfect && (summary.splitErrors > 0 || summary.labelErrors > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {summary.splitErrors > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
              Groepering ({summary.splitErrors}x)
            </span>
          )}
          {summary.labelErrors > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
              Benoeming ({summary.labelErrors}x)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SentenceComparison;
