
import React from 'react';
import { RoleDefinition } from '../types';

interface DraggableRoleProps {
  role: RoleDefinition;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, roleKey: string) => void;
  isLargeFont?: boolean;
}

export const DraggableRole: React.FC<DraggableRoleProps> = ({ 
  role, 
  onDragStart,
  isLargeFont = false
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, role.key)}
      className={`
        relative border-2 rounded-lg cursor-move select-none transition-all duration-200
        font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5
        flex items-center justify-center whitespace-nowrap
        ${isLargeFont ? 'px-5 py-3 text-base md:text-lg' : 'px-3 py-1.5 text-xs md:text-sm'}
        ${role.colorClass} ${role.borderColorClass}
      `}
    >
      <span className={`mr-1.5 opacity-60 uppercase tracking-wide hidden md:inline-block ${isLargeFont ? 'text-xs' : 'text-[10px]'}`}>
        {role.shortLabel}
      </span>
      {role.label}
    </div>
  );
};
