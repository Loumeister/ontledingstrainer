
import React, { useState, useEffect } from 'react';
import { Token, RoleDefinition, ValidationState } from '../types';

interface SentenceChunkProps {
  chunkIndex: number;
  tokens: Token[];
  startIndex: number; // Global index of the first token in this chunk
  assignedRole: RoleDefinition | null;
  assignedBijzinFunctie: RoleDefinition | null;
  bijvBepTargetText: string | null; // Text of the word this bvb bijzin refers to
  subRoles: Record<string, RoleDefinition>; // Map tokenId -> RoleDefinition
  onDropChunk: (e: React.DragEvent<HTMLDivElement>, chunkId: string) => void;
  onDropBijzinFunctie: (e: React.DragEvent<HTMLDivElement>, chunkId: string) => void;
  onDropWord: (e: React.DragEvent<HTMLSpanElement>, tokenId: string) => void;
  onRemoveRole: (chunkId: string) => void;
  onRemoveBijzinFunctie: (chunkId: string) => void;
  onRemoveSubRole: (tokenId: string) => void;
  onToggleSplit: (globalTokenIndex: number) => void;
  onStartBijvBepLinking: (sourceId: string) => void;
  onRemoveBijvBepLink: (sourceId: string) => void;
  onWordClick: (tokenId: string) => void; // For bvb linking mode
  hasBijzinFunctie: boolean; // Whether this chunk expects a bijzin function (gated by includeBB)
  isLinkingMode: boolean; // Whether any chunk is in bvb linking mode
  isLinkingSource: boolean; // Whether THIS chunk is the one being linked
  validationState?: ValidationState;
  feedbackMessage?: string | null;
  isLargeFont?: boolean;
  selectedRole?: string | null; // Currently selected role from tap-to-place
  onTapPlaceChunk?: (chunkId: string) => void; // Place selected role on a chunk
  onTapPlaceWord?: (tokenId: string) => void; // Place selected role as sub-label on a word
}

export const SentenceChunk: React.FC<SentenceChunkProps> = ({
  tokens,
  startIndex,
  assignedRole,
  assignedBijzinFunctie,
  bijvBepTargetText,
  subRoles,
  onDropChunk,
  onDropBijzinFunctie,
  onDropWord,
  onRemoveRole,
  onRemoveBijzinFunctie,
  onRemoveSubRole,
  onToggleSplit,
  onStartBijvBepLinking,
  onRemoveBijvBepLink,
  onWordClick,
  hasBijzinFunctie,
  isLinkingMode,
  isLinkingSource,
  validationState,
  feedbackMessage,
  isLargeFont = false,
  selectedRole,
  onTapPlaceChunk,
  onTapPlaceWord
}) => {
  const [isOverChunk, setIsOverChunk] = useState(false);
  const [isOverBijzinFunctie, setIsOverBijzinFunctie] = useState(false);
  const [hoveredWordId, setHoveredWordId] = useState<string | null>(null);
  const [dismissedFeedback, setDismissedFeedback] = useState(false);

  // Reset dismissed state when feedback message changes
  useEffect(() => {
    setDismissedFeedback(false);
  }, [feedbackMessage]);

  // Styling based on validation/state
  let borderColor = "border-slate-300 dark:border-slate-600";
  let bgColor = "bg-white dark:bg-slate-800";
  let statusIcon = null;

  if (isOverChunk) {
    borderColor = "border-blue-400 dark:border-blue-500";
    bgColor = "bg-blue-50 dark:bg-blue-900/20";
  } else if (validationState === 'correct') {
    borderColor = "border-green-500 dark:border-green-500";
    bgColor = "bg-green-50 dark:bg-green-900/20";
    statusIcon = <span className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm z-20">✓</span>;
  } else if (validationState === 'warning') {
    // Warning state (e.g. WG on PV)
    borderColor = "border-orange-400 dark:border-orange-500";
    bgColor = "bg-orange-50 dark:bg-orange-900/20";
    statusIcon = <span className="absolute -top-3 -right-3 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm z-20">!</span>;
  } else if (validationState === 'incorrect-role') {
    borderColor = "border-red-400 dark:border-red-500";
    bgColor = "bg-red-50 dark:bg-red-900/20";
    statusIcon = <span className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm z-20">×</span>;
  } else if (validationState === 'incorrect-split') {
    borderColor = "border-red-500 dark:border-red-600";
    bgColor = "bg-red-50 dark:bg-red-900/20";
    statusIcon = <span className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm z-20">✂</span>;
  } else if (assignedRole) {
    borderColor = assignedRole.borderColorClass;
    bgColor = "bg-white dark:bg-slate-800";
  }

  const chunkId = tokens[0].id;

  // Show bijzin function row when the sentence data expects a bijzinFunctie for this chunk
  // and the user has assigned 'bijzin' as the main chunk role
  const showBijzinFunctieRow = hasBijzinFunctie && assignedRole?.key === 'bijzin';

  const handleDragOverChunk = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (hoveredWordId) return;
    setIsOverChunk(true);
  };

  const handleDragLeaveChunk = () => {
    setIsOverChunk(false);
  };

  const handleWordDragEnter = (tokenId: string) => {
    setHoveredWordId(tokenId);
    setIsOverChunk(false);
  };

  const handleWordDragLeave = () => {
    setHoveredWordId(null);
  };

  return (
    <div 
      className={`
        relative flex flex-col min-w-[140px] rounded-xl border-2 transition-colors duration-200 group/chunk
        ${borderColor} ${bgColor}
        ${validationState === 'incorrect-split' ? 'opacity-80' : ''}
      `}
      onDragOver={handleDragOverChunk}
      onDrop={(e) => {
        if (hoveredWordId) return;
        setIsOverChunk(false);
        onDropChunk(e, chunkId);
      }}
      onDragLeave={handleDragLeaveChunk}
      onClick={() => {
        if (selectedRole && onTapPlaceChunk) {
          onTapPlaceChunk(chunkId);
        }
      }}
    >
      {/* Tooltip for Feedback - POSITIONED BELOW HEADER WITH HIGH Z-INDEX */}
      {feedbackMessage && !dismissedFeedback && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded shadow-2xl z-[9998] text-center animate-in fade-in slide-in-from-top-2 pointer-events-auto flex items-center justify-center gap-2">
          <span className="flex-1">{feedbackMessage}</span>
          <button 
            onClick={() => setDismissedFeedback(true)}
            className="flex-shrink-0 hover:bg-white/20 rounded p-0.5 transition-colors"
            title="Verbergen"
          >
            ×
          </button>
          {/* Arrow pointing up */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800 dark:border-b-slate-700"></div>
        </div>
      )}

      {/* Main Role Header */}
      <div 
        className={`
          h-9 border-b border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs rounded-t-lg relative z-10 cursor-pointer transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500
          ${assignedRole ? assignedRole.colorClass + ' font-bold hover:opacity-80' : 'text-slate-400 dark:text-slate-500 italic'}
        `}
        onClick={(e) => {
          if (assignedRole) {
            e.stopPropagation();
            onRemoveRole(chunkId);
          }
        }}
      >
        {assignedRole ? (
          <div className="flex items-center gap-2 w-full justify-center px-2 relative group/header">
            <span className="relative z-10">{assignedRole.label}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemoveRole(chunkId); }}
              className="hidden group-hover/header:flex absolute right-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full w-5 h-5 items-center justify-center transition-colors z-20 focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Verwijder benaming"
              aria-label="Verwijder benaming"
            >
              ×
            </button>
          </div>
        ) : (
          "Sleep zinsdeel hier"
        )}
      </div>

      {/* Bijzin Function Row - shown when chunk is labeled as bijzin and has a function */}
      {showBijzinFunctieRow && (
        <div
          className={`
            h-8 border-b border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center text-[11px] cursor-pointer transition-all
            ${isOverBijzinFunctie ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500' : ''}
            ${assignedBijzinFunctie ? assignedBijzinFunctie.colorClass + ' font-bold hover:opacity-80' : 'text-slate-400 dark:text-slate-500 italic'}
          `}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsOverBijzinFunctie(true); setIsOverChunk(false); }}
          onDragLeave={() => setIsOverBijzinFunctie(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOverBijzinFunctie(false);
            onDropBijzinFunctie(e, chunkId);
          }}
          onClick={(e) => {
            if (assignedBijzinFunctie) {
              e.stopPropagation();
              onRemoveBijzinFunctie(chunkId);
            }
          }}
        >
          {assignedBijzinFunctie ? (
            <div className="flex items-center gap-2 w-full justify-center px-2 relative group/functie">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1">functie:</span>
              <span className="relative z-10">{assignedBijzinFunctie.label}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveBijzinFunctie(chunkId); }}
                className="hidden group-hover/functie:flex absolute right-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full w-4 h-4 items-center justify-center transition-colors z-20 text-[10px] focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Verwijder functie"
                aria-label="Verwijder functie"
              >
                ×
              </button>
            </div>
          ) : (
            <span className="text-[10px]">Sleep functie hier (bijv. LV, BWB)</span>
          )}
        </div>
      )}

      {/* Bijv Bep Link Row - shown when bijzin function is bijv_bep */}
      {showBijzinFunctieRow && assignedBijzinFunctie?.key === 'bijv_bep' && (
        <div className="h-7 border-b border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] px-2">
          {bijvBepTargetText ? (
            <div className="flex items-center gap-1 group/link">
              <span className="text-slate-400 dark:text-slate-500">hoort bij:</span>
              <span className="font-bold text-teal-700 dark:text-teal-300">'{bijvBepTargetText}'</span>
              <button
                  onClick={(e) => { e.stopPropagation(); onRemoveBijvBepLink(chunkId); }}
                  className="opacity-0 group-hover/link:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-full w-4 h-4 flex items-center justify-center transition-all text-[10px] focus-visible:ring-2 focus-visible:ring-blue-500"
                  title="Verwijder verwijzing"
                  aria-label="Verwijder verwijzing"
                >×</button>
            </div>
          ) : isLinkingSource ? (
            <span className="text-blue-500 dark:text-blue-400 animate-pulse font-medium">
              ← Klik op het woord waar deze bijzin bij hoort
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onStartBijvBepLinking(chunkId); }}
              className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Wijs het woord aan waar deze bijzin bij hoort →
            </button>
          )}
        </div>
      )}

      {/* Words Container */}
      <div className={`
        p-3 flex flex-wrap gap-y-4 gap-x-0 justify-center items-end min-h-[60px]
        ${isLargeFont ? 'text-xl leading-relaxed' : 'text-lg leading-tight'}
      `}>
        {tokens.map((token, i) => {
           const subRole = subRoles[token.id];
           const isWordHovered = hoveredWordId === token.id;

           return (
             <React.Fragment key={token.id}>
               <div className="relative flex flex-col items-center group/word">
                  
                  {/* Sub Role Chip */}
                  {subRole && (
                    <div 
                      className={`
                        absolute -top-6 text-[9px] px-1.5 py-0.5 rounded-md border shadow-sm whitespace-nowrap z-10 cursor-pointer
                        ${subRole.colorClass || ''} ${subRole.borderColorClass || ''}
                      `}
                      onClick={(e) => { e.stopPropagation(); onRemoveSubRole(token.id); }}
                      title="Klik om te verwijderen"
                    >
                      {subRole.shortLabel}
                    </div>
                  )}

                  {/* The Word Target */}
                  <span 
                    className={`
                      text-slate-800 dark:text-slate-200 font-medium px-1 py-1 rounded transition-colors duration-200 border border-transparent
                      ${isWordHovered ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-600 shadow-sm' : ''}
                      ${!isWordHovered && !subRole ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                      ${isLinkingMode && !isLinkingSource ? 'cursor-pointer ring-2 ring-teal-300 dark:ring-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:ring-teal-500' : ''}
                    `}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); handleWordDragEnter(token.id); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); handleWordDragLeave(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDropWord(e, token.id);
                      setHoveredWordId(null);
                    }}
                    onClick={(e) => {
                      if (isLinkingMode && !isLinkingSource) {
                        e.stopPropagation();
                        onWordClick(token.id);
                      } else if (selectedRole && onTapPlaceWord) {
                        e.stopPropagation();
                        onTapPlaceWord(token.id);
                      }
                    }}
                  >
                    {token.text}
                  </span>
               </div>

               {/* Splitter */}
               {i < tokens.length - 1 && (
                 <div
                   className="w-4 h-8 flex items-center justify-center cursor-pointer group/splitter mx-[-2px] z-10 hover:w-6 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                   onClick={(e) => {
                     e.stopPropagation();
                     onToggleSplit(startIndex + i);
                   }}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                       e.preventDefault();
                       e.stopPropagation();
                       onToggleSplit(startIndex + i);
                     }
                   }}
                   tabIndex={0}
                   role="button"
                   aria-label="Splits hier"
                   title="Splits hier"
                 >
                   <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-600 group-hover/splitter:bg-blue-400 transition-colors"></div>
                   <div className="absolute opacity-0 group-hover/splitter:opacity-100 text-[10px] transform -translate-y-4 bg-blue-600 text-white px-1 rounded">✂️</div>
                 </div>
               )}
             </React.Fragment>
           );
        })}
      </div>

      {/* Validation Status */}
      {statusIcon}
      {validationState === 'incorrect-split' && (
        <div className="absolute bottom-0 w-full text-[10px] text-center bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-b-lg py-0.5">
          Foutieve splitsing
        </div>
      )}
    </div>
  );
};
