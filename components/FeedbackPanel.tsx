import React from 'react';
import { ValidationState } from '../types';

export interface FeedbackItem {
  chunkWords: string;
  message: string;
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

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ items, isLargeFont }) => {
  if (items.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-600 rounded-xl px-4 py-3 max-h-44 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={`space-y-2 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`flex-shrink-0 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold mt-0.5 ${stateColor(item.state)}`}>
              {stateIcon(item.state)}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200">"{item.chunkWords}"</span>
              <span className="mx-1.5 text-slate-400">—</span>
              <span className="text-slate-600 dark:text-slate-300">{item.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
