import { useState, useEffect } from 'react';
import { useTrainer } from './hooks/useTrainer';
import { HomeScreen } from './screens/HomeScreen';
import { ScoreScreen } from './screens/ScoreScreen';
import { TrainerScreen } from './screens/TrainerScreen';
import { SentenceEditorScreen } from './screens/SentenceEditorScreen';
import { EditorView } from './components/EditorView';
import { UsageLogScreen } from './screens/UsageLogScreen';
import { preloadCommonLevels } from './data/sentenceLoader';
import { decodeShared } from './data/customSentenceStore';
import type { Sentence } from './types';

// Decode teacher-shared sentences from ?zinnen= URL param
const sharedParam = new URLSearchParams(window.location.search).get('zinnen');
const initialSharedSentences: Sentence[] = sharedParam ? decodeShared(sharedParam) : [];

export default function App() {
  const trainer = useTrainer();
  const [showEditor, setShowEditor] = useState(() => window.location.hash === '#/editor');
  const [showDocent, setShowDocent] = useState(() => window.location.hash === '#/docent');
  const [showUsageLog, setShowUsageLog] = useState(() => window.location.hash === '#/usage');
  const [sharedSentences] = useState<Sentence[]>(initialSharedSentences);

  // Preload common sentence levels
  useEffect(() => {
    preloadCommonLevels();
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const onHashChange = () => {
      setShowEditor(window.location.hash === '#/editor');
      setShowDocent(window.location.hash === '#/docent');
      setShowUsageLog(window.location.hash === '#/usage');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Usage log screen (hidden route)
  if (showUsageLog) {
    return (
      <UsageLogScreen
        onBack={() => {
          window.location.hash = '';
          setShowUsageLog(false);
        }}
      />
    );
  }

  // Editor screen (hidden route)
  if (showEditor) {
    return (
      <SentenceEditorScreen
        onBack={() => {
          window.location.hash = '';
          setShowEditor(false);
          trainer.refreshCustomSentences();
        }}
      />
    );
  }

  // Docent screen (teacher analytics area)
  if (showDocent) {
    return <EditorView darkMode={trainer.darkMode} />;
  }

  // Home Screen: no active sentence and no finished session
  if (!trainer.currentSentence && !trainer.isSessionFinished) {
    return (
      <HomeScreen
        predicateMode={trainer.predicateMode} setPredicateMode={trainer.setPredicateMode}
        selectedLevel={trainer.selectedLevel} setSelectedLevel={trainer.setSelectedLevel}
        customSessionCount={trainer.customSessionCount} setCustomSessionCount={trainer.setCustomSessionCount}
        focusLV={trainer.focusLV} setFocusLV={trainer.setFocusLV}
        focusMV={trainer.focusMV} setFocusMV={trainer.setFocusMV}
        focusVV={trainer.focusVV} setFocusVV={trainer.setFocusVV}
        focusBijzin={trainer.focusBijzin} setFocusBijzin={trainer.setFocusBijzin}
        includeBijst={trainer.includeBijst} setIncludeBijst={trainer.setIncludeBijst}
        includeBB={trainer.includeBB} setIncludeBB={trainer.setIncludeBB}
        showHelp={trainer.showHelp} setShowHelp={trainer.setShowHelp}
        darkMode={trainer.darkMode} setDarkMode={trainer.setDarkMode}
        largeFont={trainer.largeFont} setLargeFont={trainer.setLargeFont}
        dyslexiaMode={trainer.dyslexiaMode} setDyslexiaMode={trainer.setDyslexiaMode}
        availableSentences={trainer.availableSentences}
        isLoadingSentences={trainer.isLoadingSentences}
        sentenceLoadError={trainer.sentenceLoadError}
        refreshCustomSentences={trainer.refreshCustomSentences}
        startSession={trainer.startSession}
        handleSentenceSelect={trainer.handleSentenceSelect}
        sharedSentences={sharedSentences}
        startSharedSession={trainer.startSharedSession}
      />
    );
  }

  // Score Screen: session finished
  if (trainer.isSessionFinished) {
    return (
      <ScoreScreen
        sessionStats={trainer.sessionStats}
        mistakeStats={trainer.mistakeStats}
        sessionSentenceResults={trainer.sessionSentenceResults}
        resetToHome={trainer.resetToHome}
        startSession={trainer.startSession}
        sessionQueue={trainer.sessionQueue}
        selectedLevel={trainer.selectedLevel}
      />
    );
  }

  // Trainer Screen: active exercise
  return (
    <TrainerScreen
      currentSentence={trainer.currentSentence} step={trainer.step} mode={trainer.mode}
      splitIndices={trainer.splitIndices} chunkLabels={trainer.chunkLabels} subLabels={trainer.subLabels} bijzinFunctieLabels={trainer.bijzinFunctieLabels}
      bijvBepLinks={trainer.bijvBepLinks} linkingBijvBepId={trainer.linkingBijvBepId}
      validationResult={trainer.validationResult} showAnswerMode={trainer.showAnswerMode} hintMessage={trainer.hintMessage}
      confirmAction={trainer.confirmAction} setConfirmAction={trainer.setConfirmAction}
      showHelp={trainer.showHelp} setShowHelp={trainer.setShowHelp}
      darkMode={trainer.darkMode} setDarkMode={trainer.setDarkMode}
      largeFont={trainer.largeFont} setLargeFont={trainer.setLargeFont}
      dyslexiaMode={trainer.dyslexiaMode} setDyslexiaMode={trainer.setDyslexiaMode}
      includeVV={trainer.includeVV} includeBB={trainer.includeBB}
      focusVV={trainer.focusVV} focusBijzin={trainer.focusBijzin}
      selectedLevel={trainer.selectedLevel}
      sessionIndex={trainer.sessionIndex} sessionQueue={trainer.sessionQueue}
      userChunks={trainer.userChunks}
      toggleSplit={trainer.toggleSplit} handleNextStep={trainer.handleNextStep} handleBackStep={trainer.handleBackStep}
      handleDragStart={trainer.handleDragStart} handleDropChunk={trainer.handleDropChunk} handleDropWord={trainer.handleDropWord}
      removeLabel={trainer.removeLabel} removeSubLabel={trainer.removeSubLabel}
      handleDropBijzinFunctie={trainer.handleDropBijzinFunctie} removeBijzinFunctieLabel={trainer.removeBijzinFunctieLabel}
      startBijvBepLinking={trainer.startBijvBepLinking} completeBijvBepLink={trainer.completeBijvBepLink} cancelBijvBepLinking={trainer.cancelBijvBepLinking} removeBijvBepLink={trainer.removeBijvBepLink}
      handleHint={trainer.handleHint} handleCheck={trainer.handleCheck}
      handleShowAnswerRequest={trainer.handleShowAnswerRequest} handleAbortRequest={trainer.handleAbortRequest} handleConfirmAction={trainer.handleConfirmAction}
      nextSessionSentence={trainer.nextSessionSentence}
    />
  );
}
