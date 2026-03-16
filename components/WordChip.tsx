
import React, { useRef, useEffect } from 'react';
import { RoleDefinition, RoleKey } from '../types';

interface DraggableRoleProps {
  role: RoleDefinition;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, roleKey: string) => void;
  isLargeFont?: boolean;
  isSelected?: boolean;
  onSelect?: (roleKey: RoleKey) => void;
  onTouchDropChunk?: (chunkId: string, roleKey: string) => void;
}

export const DraggableRole: React.FC<DraggableRoleProps> = ({
  role,
  onDragStart,
  isLargeFont = false,
  isSelected,
  onSelect,
  onTouchDropChunk,
}) => {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chipRef.current;
    if (!el) return;
    const handleNativeTouchMove = (e: TouchEvent) => {
      if (!touchStartPos.current) return;
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
  }, [isSelected, onSelect, role.key]);

  const handleClick = () => {
    onSelect?.(role.key);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(role.key);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDragging.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
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
      draggable
      onDragStart={(e) => onDragStart(e, role.key)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="button"
      aria-label={role.label}
      aria-pressed={isSelected !== undefined ? isSelected : undefined}
      style={{ touchAction: 'none' }}
      className={`
        relative border-2 rounded-lg cursor-move select-none transition-all duration-200
        font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5
        flex items-center justify-center whitespace-nowrap
        focus-visible:ring-2 focus-visible:ring-blue-500
        ${isLargeFont ? 'px-5 py-3 text-base md:text-lg' : 'px-3 py-1.5 text-xs md:text-sm'}
        ${role.colorClass} ${role.borderColorClass}
        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-400 animate-pulse' : ''}
      `}
    >
      <span className={`mr-1.5 opacity-60 uppercase tracking-wide hidden md:inline-block ${isLargeFont ? 'text-xs' : 'text-[10px]'}`}>
        {role.shortLabel}
      </span>
      {role.label}
    </div>
  );
};
