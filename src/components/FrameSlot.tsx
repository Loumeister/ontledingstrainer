import React from 'react';
import { ChunkCard, FrameSlotKey } from '../types';

interface FrameSlotProps {
  slot: FrameSlotKey;
  slotLabel: string;
  colorClass: string;
  placedCard: ChunkCard | null;
  isHighlighted: boolean;
  onTapPlace: () => void;
  onRemove: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  darkMode: boolean;
}

export const FrameSlot: React.FC<FrameSlotProps> = ({
  slot,
  slotLabel,
  colorClass,
  placedCard,
  isHighlighted,
  onTapPlace,
  onRemove,
  onDragOver,
  onDrop,
  darkMode: _darkMode,
}) => {
  const cardText = placedCard
    ? placedCard.tokens.map((t) => t.text).join(' ')
    : null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (placedCard) {
        onRemove();
      } else {
        onTapPlace();
      }
    }
  };

  const handleRemoveKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onRemove();
    }
  };

  if (placedCard) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${slotLabel}: ${cardText}. Tik om te verwijderen.`}
        data-slot={slot}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onKeyDown={handleKeyDown}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-xl
          border-2 shadow-sm select-none transition-all duration-150
          cursor-pointer min-h-[2.75rem]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${colorClass}
          ${isHighlighted
            ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
            : 'border-transparent'
          }
        `}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 shrink-0 hidden sm:inline">
          {slot.toUpperCase()}
        </span>
        <span className="font-semibold text-sm leading-tight flex-1 min-w-0 truncate">
          {cardText}
        </span>
        <button
          type="button"
          aria-label={`Verwijder ${slotLabel}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={handleRemoveKeyDown}
          className={`
            shrink-0 w-5 h-5 flex items-center justify-center rounded-full
            text-xs font-bold leading-none
            opacity-60 hover:opacity-100 transition-opacity duration-100
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            bg-black/10 dark:bg-white/20
          `}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        isHighlighted
          ? `Plaats kaart in sleuf: ${slotLabel}`
          : `Lege sleuf: ${slotLabel}`
      }
      data-slot={slot}
      onClick={onTapPlace}
      onKeyDown={handleKeyDown}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        flex items-center justify-center gap-2 px-3 py-2 rounded-xl
        border-2 border-dashed min-h-[2.75rem]
        select-none transition-all duration-150 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${isHighlighted
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-500'
        }
      `}
    >
      <span
        className={`
          text-xs font-semibold uppercase tracking-wide
          ${isHighlighted
            ? 'text-blue-600 dark:text-blue-300'
            : 'text-slate-400 dark:text-slate-500'
          }
        `}
      >
        {slotLabel}
      </span>
    </div>
  );
};
