import React from 'react';
import { ROLES } from '../constants';
import { RoleDefinition } from '../types';
import { DraggableRole } from '../components/WordChip';
import { SentenceChunk } from '../components/DropZone';
import { HelpModal } from '../components/HelpModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TrainerState } from '../hooks/useTrainer';

type TrainerScreenProps = Pick<TrainerState,
  | 'currentSentence' | 'step' | 'mode'
  | 'splitIndices' | 'chunkLabels' | 'subLabels' | 'bijzinFunctieLabels'
  | 'bijvBepLinks' | 'linkingBijvBepId'
  | 'validationResult' | 'showAnswerMode' | 'hintMessage'
  | 'confirmAction' | 'setConfirmAction'
  | 'showHelp' | 'setShowHelp'
  | 'darkMode' | 'setDarkMode'
  | 'largeFont' | 'setLargeFont'
  | 'includeVV' | 'includeBB'
  | 'focusVV' | 'focusBijzin'
  | 'selectedLevel'
  | 'sessionIndex' | 'sessionQueue'
  | 'userChunks'
  | 'toggleSplit' | 'handleNextStep' | 'handleBackStep'
  | 'handleDragStart' | 'handleDropChunk' | 'handleDropWord'
  | 'removeLabel' | 'removeSubLabel'
  | 'handleDropBijzinFunctie' | 'removeBijzinFunctieLabel'
  | 'startBijvBepLinking' | 'completeBijvBepLink' | 'cancelBijvBepLinking' | 'removeBijvBepLink'
  | 'handleHint' | 'handleCheck'
  | 'handleShowAnswerRequest' | 'handleAbortRequest' | 'handleConfirmAction'
  | 'nextSessionSentence'
>;

export const TrainerScreen: React.FC<TrainerScreenProps> = ({
  currentSentence, step, mode,
  splitIndices, chunkLabels, subLabels, bijzinFunctieLabels,
  bijvBepLinks, linkingBijvBepId,
  validationResult, showAnswerMode, hintMessage,
  confirmAction, setConfirmAction,
  showHelp, setShowHelp,
  darkMode, setDarkMode,
  largeFont, setLargeFont,
  includeVV, includeBB,
  focusVV, focusBijzin,
  selectedLevel,
  sessionIndex, sessionQueue,
  userChunks,
  toggleSplit, handleNextStep, handleBackStep,
  handleDragStart, handleDropChunk, handleDropWord,
  removeLabel, removeSubLabel,
  handleDropBijzinFunctie, removeBijzinFunctieLabel,
  startBijvBepLinking, completeBijvBepLink, cancelBijvBepLinking, removeBijvBepLink,
  handleHint, handleCheck,
  handleShowAnswerRequest, handleAbortRequest, handleConfirmAction,
  nextSessionSentence,
}) => {
  if (!currentSentence) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-4 font-sans transition-colors duration-300 flex flex-col">

      <ConfirmationModal
         isOpen={confirmAction === 'answer'}
         title="Antwoord tonen?"
         message="Weet je zeker dat je het antwoord wilt zien? Je krijgt dan geen punten voor deze zin."
         onConfirm={handleConfirmAction}
         onCancel={() => setConfirmAction(null)}
      />

      <ConfirmationModal
         isOpen={confirmAction === 'abort'}
         title="Sessie afbreken?"
         message="Weet je zeker dat je wilt stoppen? Je voortgang in deze sessie gaat verloren."
         onConfirm={handleConfirmAction}
         onCancel={() => setConfirmAction(null)}
      />

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <main className="max-w-6xl mx-auto w-full flex flex-col gap-4 flex-1 mb-20">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Zinsontledingstrainer</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setLargeFont(!largeFont)} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all border ${largeFont ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'}`} title="Lettergrootte">aA</button>
            <button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all" title="Donkere modus">
              {darkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>}
            </button>
            <button onClick={() => setShowHelp(true)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors" title="Instructies">?</button>
          </div>
        </header>

        {/* Progress Stepper */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
            <div className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 'split' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`} onClick={() => !showAnswerMode && handleBackStep()}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'split' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:border-blue-400' : 'border-slate-300 dark:border-slate-600'}`}>1</span>Verdelen
            </div>
            <span className="text-slate-300 dark:text-slate-600">&rarr;</span>
            <div className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 'label' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'label' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:border-blue-400' : 'border-slate-300 dark:border-slate-600'}`}>2</span>Benoemen
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Feedback Block */}
          {validationResult && (
            <div className={`p-3 rounded-xl text-center font-bold animate-in slide-in-from-top-2 duration-300 ${validationResult.isPerfect ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border border-green-200 dark:border-green-800' : 'bg-orange-50 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border border-orange-200 dark:border-orange-800'}`}>
              {validationResult.isPerfect ? "🎉 Perfect! Alles goed verdeeld en benoemd." : `Je hebt ${validationResult.score} van de ${validationResult.total} zinsdelen goed.`}
            </div>
          )}

          {/* Hint Message */}
          {hintMessage && !validationResult && (
            <div className="p-3 rounded-xl text-center font-bold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 animate-in slide-in-from-bottom-2 duration-300">
              💡 {hintMessage}
            </div>
          )}

          {showAnswerMode && <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-center font-bold">Dit is de juiste oplossing.</div>}

          {/* STEP 1: SPLITTING VIEW */}
          {step === 'split' && (
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center animate-in fade-in duration-300 flex-1 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Stap 1: Verdelen</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Klik tussen de woorden om de zin in zinsdelen te knippen.</p>

              <div className={`flex flex-wrap items-center justify-center gap-y-6 select-none py-4 ${largeFont ? 'text-2xl md:text-3xl leading-relaxed' : 'text-xl md:text-2xl leading-loose'}`}>
                {currentSentence.tokens.map((token, idx) => (
                  <React.Fragment key={token.id}>
                    <span className="px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-800 dark:text-slate-100 font-medium transition-colors">{token.text}</span>
                    {idx < currentSentence.tokens.length - 1 && (
                      <div onClick={() => toggleSplit(idx)} className="group relative w-10 h-12 mx-0 cursor-pointer flex items-center justify-center transition-all">
                        <div className={`w-1 h-8 rounded-full transition-all duration-200 ${splitIndices.has(idx) ? 'bg-blue-500 h-10 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'bg-slate-200 dark:bg-slate-600 group-hover:bg-slate-300 dark:group-hover:bg-slate-500'}`}></div>
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-700 rounded-full shadow-md border dark:border-slate-600 flex items-center justify-center text-sm transition-all duration-200 pointer-events-none z-10 ${splitIndices.has(idx) ? 'opacity-100 border-blue-500 text-blue-500 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-slate-400'}`}>✂️</div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <button onClick={handleNextStep} className="group px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-0.5 transition-all flex items-center gap-3">Naar benoemen<span className="group-hover:translate-x-1 transition-transform">&rarr;</span></button>
              </div>
            </div>
          )}

          {/* STEP 2: LABELING VIEW */}
          {step === 'label' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
              {!showAnswerMode && (
                <RoleToolbar
                  currentSentence={currentSentence}
                  includeVV={includeVV}
                  includeBB={includeBB}
                  focusVV={focusVV}
                  focusBijzin={focusBijzin}
                  selectedLevel={selectedLevel}
                  largeFont={largeFont}
                  handleDragStart={handleDragStart}
                />
              )}

              {/* Banner for bijv_bep linking mode */}
              {linkingBijvBepId && (
                <div className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-lg text-sm text-teal-700 dark:text-teal-300">
                  <span>Klik op het woord waar deze bijzin bij hoort</span>
                  <button
                    onClick={cancelBijvBepLinking}
                    className="px-2 py-0.5 text-xs rounded bg-teal-100 dark:bg-teal-800 hover:bg-teal-200 dark:hover:bg-teal-700 transition-colors"
                  >Annuleren</button>
                </div>
              )}

              <div className="flex flex-wrap gap-y-6 gap-x-2 justify-center items-start pt-2 px-1 flex-1 content-start">
                {userChunks.map((chunk, idx) => {
                  const startTokenId = chunk.tokens[0].id;
                  const assignedRoleKey = chunkLabels[startTokenId];
                  const roleDef = assignedRoleKey ? ROLES.find(r => r.key === assignedRoleKey) || null : null;
                  const bijzinFunctieKey = bijzinFunctieLabels[startTokenId];
                  const bijzinFunctieDef = bijzinFunctieKey ? ROLES.find(r => r.key === bijzinFunctieKey) || null : null;
                  const rawFunctie = chunk.tokens[0].bijzinFunctie;
                  // Gate bijv_bep function behind includeBB
                  const hasBijzinFunctie = !!rawFunctie && (rawFunctie !== 'bijv_bep' || includeBB);
                  // Resolve bvb link target text
                  const bijvBepTargetId = bijvBepLinks[startTokenId];
                  const bijvBepTargetToken = bijvBepTargetId ? currentSentence.tokens.find(t => t.id === bijvBepTargetId) : null;
                  const bijvBepTargetText = bijvBepTargetToken?.text || null;
                  const chunkSubRoles: Record<string, RoleDefinition> = {};
                  chunk.tokens.forEach(t => {
                    if (subLabels[t.id]) {
                      const found = ROLES.find(r => r.key === subLabels[t.id]);
                      if (found) chunkSubRoles[t.id] = found;
                    }
                  });
                  const mergeIndex = chunk.originalIndices[chunk.originalIndices.length - 1];

                  return (
                    <React.Fragment key={startTokenId}>
                      <SentenceChunk
                        chunkIndex={idx}
                        tokens={chunk.tokens}
                        startIndex={chunk.originalIndices[0]}
                        assignedRole={roleDef}
                        assignedBijzinFunctie={bijzinFunctieDef}
                        bijvBepTargetText={bijvBepTargetText}
                        subRoles={chunkSubRoles}
                        onDropChunk={handleDropChunk}
                        onDropBijzinFunctie={handleDropBijzinFunctie}
                        onDropWord={handleDropWord}
                        onRemoveRole={removeLabel}
                        onRemoveBijzinFunctie={removeBijzinFunctieLabel}
                        onRemoveSubRole={removeSubLabel}
                        onToggleSplit={toggleSplit}
                        onStartBijvBepLinking={startBijvBepLinking}
                        onRemoveBijvBepLink={removeBijvBepLink}
                        onWordClick={completeBijvBepLink}
                        hasBijzinFunctie={hasBijzinFunctie}
                        isLinkingMode={!!linkingBijvBepId}
                        isLinkingSource={linkingBijvBepId === startTokenId}
                        validationState={validationResult?.chunkStatus[idx]}
                        feedbackMessage={validationResult?.chunkFeedback[idx]}
                        isLargeFont={largeFont}
                      />

                      {idx < userChunks.length - 1 && (
                        <div className="flex items-center self-center px-1">
                          <button onClick={() => toggleSplit(mergeIndex)} disabled={showAnswerMode} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-300 dark:text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 hover:border-blue-300 flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" title="Samenvoegen"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg></button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <footer className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[500] p-3">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">

            {/* Left: Sentence Label */}
            <div className="font-medium text-slate-800 dark:text-white text-sm md:text-base truncate max-w-[50%]">
              {currentSentence.label}
            </div>

            {/* Center: Session Progress */}
            {mode === 'session' && (
              <div className="flex flex-col items-center w-full md:w-auto">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Zin {sessionIndex + 1} / {sessionQueue.length}
                </div>
                <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((sessionIndex + 1) / sessionQueue.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Right: Actions */}
            <div className="flex gap-2">
              {step === 'split' ? (
                <div className="flex gap-2">
                  <button onClick={handleNextStep} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm">
                    Naar benoemen &rarr;
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleBackStep} className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors">
                    &larr; Terug
                  </button>

                  {!showAnswerMode && (
                    <>
                      <button
                        onClick={handleHint}
                        className="px-3 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:hover:bg-yellow-900/50 font-bold rounded-lg transition-colors text-sm"
                      >
                        Hint
                      </button>
                      <button
                        onClick={handleCheck}
                        disabled={Object.keys(chunkLabels).length === 0}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        Check
                      </button>
                    </>
                  )}

                  {mode === 'session' && (validationResult || showAnswerMode) && (
                    <button onClick={nextSessionSentence} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm">
                      Volgende
                    </button>
                  )}

                  {!showAnswerMode && !validationResult?.isPerfect && (
                    <button onClick={handleShowAnswerRequest} className="px-3 py-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg font-medium text-sm transition-colors">
                      Antwoord
                    </button>
                  )}
                </div>
              )}

              <div className="w-px h-8 bg-slate-200 dark:bg-slate-600 mx-2"></div>

              <button
                onClick={handleAbortRequest}
                className="px-3 py-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg font-medium text-sm transition-colors"
              >
                {mode === 'free' ? 'Stop' : 'Afbreken'}
              </button>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

// --- Extracted sub-component for the role toolbar ---

interface RoleToolbarProps {
  currentSentence: TrainerState['currentSentence'];
  includeVV: boolean;
  includeBB: boolean;
  focusVV: boolean;
  focusBijzin: boolean;
  selectedLevel: TrainerState['selectedLevel'];
  largeFont: boolean;
  handleDragStart: TrainerState['handleDragStart'];
}

const RoleToolbar: React.FC<RoleToolbarProps> = ({
  currentSentence,
  includeVV, includeBB,
  focusVV, focusBijzin,
  selectedLevel,
  largeFont,
  handleDragStart,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 sticky top-0 z-[100] transition-all">
      <div className="flex flex-col gap-2 md:gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Zinsdelen & Gezegde:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {/* Main syntactic roles */}
            {ROLES.filter(r => !r.isSubOnly && !['wg', 'nwd', 'bijzin', 'vw_neven', 'bijst'].includes(r.key as string))
                  .filter(r => (includeVV || focusVV || selectedLevel === 2 || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.role === 'vv'))) || r.key !== 'vv')
                  .map(role => (
              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} isLargeFont={largeFont} />
            ))}

            <div className="w-full" />

            {/* WG, NG group */}
            {ROLES.filter(r => !r.isSubOnly && ['wg', 'nwd'].includes(r.key as string))
                  .map(role => (
              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} isLargeFont={largeFont} />
            ))}

            {/* Bijzin, VW_Neven group */}
            <div className="w-6" />
            {ROLES.filter(r => !r.isSubOnly && ['bijzin', 'vw_neven'].includes(r.key as string))
                  .filter(r => r.key !== 'bijzin' || focusBijzin || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.role === 'bijzin')))
                  .filter(r => r.key !== 'vw_neven' || focusBijzin || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.role === 'vw_neven')))
                  .map(role => (
              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} isLargeFont={largeFont} />
            ))}

            {/* Bijstelling */}
            <div className="w-3" />
            {ROLES.filter(r => !r.isSubOnly && r.key === 'bijst')
                  .map(role => (
              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} isLargeFont={largeFont} />
            ))}
          </div>
        </div>
        {includeBB && (
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sleep op specifieke woorden:</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.filter(r => r.isSubOnly)
                  .filter(r => r.key !== 'vw_onder' || focusBijzin || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.subRole === 'vw_onder')))
                  .map(role => (
              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} isLargeFont={largeFont} />
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
