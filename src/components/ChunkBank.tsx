import React from 'react';
import { ChunkCard } from '../types';

interface ChunkBankProps {
  cards: ChunkCard[];
  placedCardIds: Set<string>;
  selectedCardId?: string | null; // deprecated, ignored
  onCardTap: (card: ChunkCard) => void;
  onDragStart: (e: React.DragEvent, card: ChunkCard) => void;
  darkMode: boolean;
}

export const ChunkBank: React.FC<ChunkBankProps> = ({
  cards,
  placedCardIds,
  onCardTap,
  onDragStart,
  darkMode: _darkMode,
}) => {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">
        Geen kaarten beschikbaar.
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="list"
      aria-label="Woordbank"
    >
      {cards.map((card) => {
        const isPlaced = placedCardIds.has(card.id);
        const cardText = card.tokens.map((t) => t.text).join(' ');

        const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (isPlaced) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardTap(card);
          }
        };

        return (
          <div
            key={card.id}
            role="listitem"
          >
            <div
              draggable={!isPlaced}
              role="button"
              tabIndex={isPlaced ? -1 : 0}
              aria-label={isPlaced ? `${cardText} (al geplaatst)` : cardText}
              aria-disabled={isPlaced}
              onClick={() => {
                if (!isPlaced) onCardTap(card);
              }}
              onKeyDown={handleKeyDown}
              onDragStart={isPlaced ? undefined : (e) => onDragStart(e, card)}
              style={{ touchAction: 'none' }}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full
                border-2 text-sm font-semibold select-none
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${isPlaced
                  ? 'opacity-40 cursor-default border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 pointer-events-none'
                  : 'cursor-pointer border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:hover:border-slate-500 dark:hover:bg-slate-600 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                }
              `}
            >
              {cardText}
            </div>
          </div>
        );
      })}
    </div>
  );
};
