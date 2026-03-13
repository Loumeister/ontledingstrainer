import React, { useState } from 'react';
import { SentenceResult, ValidationState } from '../types';
import { ROLES } from '../constants';
import { buildUserChunks } from '../validation';

interface SentenceResultCardProps {
  result: SentenceResult;
  index: number;
}

const statusIcon = (result: SentenceResult): string => {
  if (result.showAnswerUsed && Object.keys(result.chunkStatus).length === 0) return '\u{1F441}'; // eye - answer shown without attempt
  if (result.isPerfect) return '\u2705'; // checkmark
  if (result.showAnswerUsed) return '\u{1F4A1}'; // lightbulb - checked then shown
  return '\u274C'; // cross
};

const chunkColorClass = (status: ValidationState): string => {
  switch (status) {
    case 'correct':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
    case 'incorrect-role':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
    case 'incorrect-split':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }
};

export const SentenceResultCard: React.FC<SentenceResultCardProps> = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);

  const { sentence, score, total, chunkStatus, chunkFeedback, userLabels } = result;
  const hasDetails = Object.keys(chunkStatus).length > 0;

  // Build the user's chunks for display
  const splitSet = new Set(result.splitIndices);
  const userChunks = buildUserChunks(sentence.tokens, splitSet);

  // Build correct chunks for "zo had het gemoeten"
  const correctChunks: { tokens: typeof sentence.tokens; role: string }[] = [];
  let currentRole = sentence.tokens[0].role;
  let currentTokens = [sentence.tokens[0]];
  for (let i = 1; i < sentence.tokens.length; i++) {
    const t = sentence.tokens[i];
    if (t.role !== currentRole || t.newChunk) {
      const roleDef = ROLES.find(r => r.key === currentRole);
      correctChunks.push({ tokens: [...currentTokens], role: roleDef?.shortLabel || currentRole });
      currentRole = t.role;
      currentTokens = [t];
    } else {
      currentTokens.push(t);
    }
  }
  const lastRoleDef = ROLES.find(r => r.key === currentRole);
  correctChunks.push({ tokens: currentTokens, role: lastRoleDef?.shortLabel || currentRole });

  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          hasDetails ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer' : 'cursor-default'
        }`}
      >
        <span className="text-lg shrink-0" role="img" aria-label={
          result.showAnswerUsed && Object.keys(result.chunkStatus).length === 0
            ? 'Antwoord bekeken'
            : result.isPerfect
            ? 'Perfect'
            : result.showAnswerUsed
            ? 'Gecontroleerd en bekeken'
            : 'Fout'
        }>{statusIcon(result)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
            <span className="text-slate-400 dark:text-slate-500 mr-1">{index + 1}.</span>
            {sentence.tokens.map(t => t.text).join(' ')}
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {result.showAnswerUsed && Object.keys(chunkStatus).length === 0
            ? 'Antwoord bekeken'
            : `${score}/${total}`}
        </span>
        {hasDetails && (
          <span className={`text-slate-400 dark:text-slate-500 transition-transform text-xs ${expanded ? 'rotate-180' : ''}`}>
            &#9660;
          </span>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          {/* Colored chunk visualization */}
          <div className="pt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Jouw antwoord:</p>
            <div className="flex flex-wrap gap-1">
              {userChunks.map((chunk, idx) => {
                const status = chunkStatus[idx] || null;
                const firstTokenId = chunk.tokens[0].id;
                const label = userLabels[firstTokenId];
                const roleDef = label ? ROLES.find(r => r.key === label) : null;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${chunkColorClass(status)}`}
                  >
                    {chunk.tokens.map(t => t.text).join(' ')}
                    {roleDef && (
                      <span className="opacity-70 text-[10px]">({roleDef.shortLabel})</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Correct answer */}
          {!result.isPerfect && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Zo had het gemoeten:</p>
              <div className="flex flex-wrap gap-1">
                {correctChunks.map((chunk, idx) => {
                  const roleDef = ROLES.find(r => r.shortLabel === chunk.role);
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        roleDef
                          ? `${roleDef.colorClass} border ${roleDef.borderColorClass}`
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {chunk.tokens.map(t => t.text).join(' ')}
                      <span className="opacity-70 text-[10px]">({chunk.role})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-chunk feedback */}
          {Object.entries(chunkFeedback).length > 0 && (
            <div className="space-y-1">
              {Object.entries(chunkFeedback).map(([idxStr, feedback]) => {
                const idx = Number(idxStr);
                const chunk = userChunks[idx];
                if (!chunk) return null;
                const words = chunk.tokens.map(t => t.text).join(' ');
                return (
                  <p key={idxStr} className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-medium">"{words}":</span>{' '}
                    <span className="italic">{feedback}</span>
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
