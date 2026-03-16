
import React, { useRef, useEffect } from 'react';
import { RoleDefinition, RoleKey } from '../types';

interface DraggableRoleProps {
  role: RoleDefinition;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, roleKey: string) => void;
  isLargeFont?: boolean;
  isSelected?: boolean;
  onSelect?: (roleKey: RoleKey) => void;
  onTouchDropChunk?: (chunkId: string, roleKey: string) => void;
  disabled?: boolean;
}

export const DraggableRole: React.FC<DraggableRoleProps> = ({
  role,
  onDragStart,
  isLargeFont = false,
  isSelected,
  onSelect,
  onTouchDropChunk,
  disabled = false,
}) => {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chipRef.current;
    if (!el) return;
    const handleNativeTouchMove = (e: TouchEvent) => {
      if (disabled || !touchStartPos.current) return;
      e.preventDefault(); // must be in non-passive listener to block page scroll
      const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      if (dx > 8 || dy > 8) {
        isDragging.current = true;
        if (!isSelected) onSelect?.(role.key);
      }
    };
    el.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => { el.removeEventListener('touchmove', handleNativeTouchMove); };
  }, [disabled, isSelected, onSelect, role.key]);

  const handleClick = () => {
    if (disabled) return;
    onSelect?.(role.key);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(role.key);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDragging.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    if (isDragging.current && onTouchDropChunk) {
      e.preventDefault(); // prevent the subsequent click from deselecting
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const chunkEl = el?.closest('[data-chunk-id]');
      if (chunkEl) {
        const chunkId = chunkEl.getAttribute('data-chunk-id');
        if (chunkId) {
          onTouchDropChunk(chunkId, role.key);
        }
      }
    }
    isDragging.current = false;
    touchStartPos.current = null;
  };

  return (
    <div
      ref={chipRef}
      draggable={!disabled}
      onDragStart={disabled ? undefined : (e) => onDragStart(e, role.key)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={role.label}
      aria-pressed={isSelected !== undefined ? isSelected : undefined}
      aria-disabled={disabled}
      style={{ touchAction: 'none' }}
      className={`
        relative border-2 rounded-lg select-none transition-all duration-200
        font-bold shadow-sm
        flex items-center justify-center whitespace-nowrap
        ${isLargeFont ? 'px-5 py-3 text-base md:text-lg' : 'px-3 py-1.5 text-xs md:text-sm'}
        ${disabled
          ? 'opacity-35 cursor-not-allowed grayscale pointer-events-none bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500'
          : `cursor-move hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 ${role.colorClass} ${role.borderColorClass}`
        }
        ${!disabled && isSelected ? 'ring-2 ring-offset-2 ring-blue-400 animate-pulse' : ''}
      `}
    >
      <span className={`mr-1.5 opacity-60 uppercase tracking-wide hidden md:inline-block ${isLargeFont ? 'text-xs' : 'text-[10px]'}`}>
        {role.shortLabel}
      </span>
      {role.label}
    </div>
  );
};
