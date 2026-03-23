import React, { useState } from 'react';
import { ValidationState, FeedbackEntry, RichFeedbackEntry } from '../types';

export interface FeedbackItem {
  chunkWords: string;
  feedback: FeedbackEntry;
  state: ValidationState;
}

interface FeedbackPanelProps {
  items: FeedbackItem[];
  isLargeFont?: boolean;
}

const stateIcon = (state: ValidationState): string => {
  if (state === 'incorrect-split') return '✂';
  if (state === 'incorrect-role') return '×';
  if (state === 'warning') return '!';
  return '•';
};

const stateColor = (state: ValidationState) => {
  if (state === 'incorrect-split' || state === 'incorrect-role')
    return 'bg-red-500';
  if (state === 'warning')
    return 'bg-orange-500';
  return 'bg-slate-400';
};

function isRichFeedback(entry: FeedbackEntry): entry is RichFeedbackEntry {
  return typeof entry !== 'string';
}

/** Render herstelvraag with highlighted sleutelwoord */
const HerstelvraagText: React.FC<{
  entry: RichFeedbackEntry;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ entry, isExpanded, onToggle }) => {
  const { herstelvraag, sleutelwoord } = entry;
  const regex = new RegExp(`(\\b${sleutelwoord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`, 'i');
  const parts = herstelvraag.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="underline decoration-dotted underline-offset-2 text-slate-700 dark:text-slate-300 cursor-help font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-expanded={isExpanded}
            aria-label={`Meer uitleg over "${part}"`}
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

/** Expanded three-layer explanation */
const UitlegPanel: React.FC<{ uitleg: RichFeedbackEntry['uitleg'] }> = ({ uitleg }) => (
  <div className="mt-2 ml-7 space-y-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-slate-200 dark:border-slate-600">
      <span className="font-semibold text-blue-700 dark:text-blue-300">Diagnose</span>
      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{uitleg.diagnose}</p>
    </div>
    <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-slate-200 dark:border-slate-600">
      <span className="font-semibold text-amber-700 dark:text-amber-300">Redenering</span>
      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{uitleg.redenering}</p>
    </div>
    <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20">
      <span className="font-semibold text-green-700 dark:text-green-300">Herstap</span>
      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{uitleg.herstap}</p>
    </div>
  </div>
);

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ items, isLargeFont }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const handleToggle = (index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

  return (
    <div className="bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-600 rounded-xl px-4 py-3 max-h-44 md:max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={`space-y-2 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex items-start gap-2">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold mt-0.5 ${stateColor(item.state)}`}>
                {stateIcon(item.state)}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800 dark:text-slate-200">"{item.chunkWords}"</span>
                <span className="mx-1.5 text-slate-400">—</span>
                {isRichFeedback(item.feedback) ? (
                  <HerstelvraagText
                    entry={item.feedback}
                    isExpanded={expandedIndex === i}
                    onToggle={() => handleToggle(i)}
                  />
                ) : (
                  <span className="text-slate-600 dark:text-slate-300">{item.feedback}</span>
                )}
              </div>
            </div>
            {isRichFeedback(item.feedback) && expandedIndex === i && (
              <UitlegPanel uitleg={item.feedback.uitleg} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
