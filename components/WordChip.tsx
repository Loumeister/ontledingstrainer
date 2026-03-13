
import React from 'react';
import { RoleDefinition, RoleKey } from '../types';

interface DraggableRoleProps {
  role: RoleDefinition;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, roleKey: string) => void;
  isLargeFont?: boolean;
  isSelected?: boolean;
  onSelect?: (roleKey: RoleKey) => void;
}

export const DraggableRole: React.FC<DraggableRoleProps> = ({
  role,
  onDragStart,
  isLargeFont = false,
  isSelected,
  onSelect
}) => {
  const handleClick = () => {
    onSelect?.(role.key);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(role.key);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, role.key)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={role.label}
      aria-pressed={isSelected !== undefined ? isSelected : undefined}
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
