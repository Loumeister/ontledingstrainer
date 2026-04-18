import { useState, useEffect } from 'react';
import { useTrainer } from './hooks/useTrainer';
import { HomeScreen } from './screens/HomeScreen';
import { ScoreScreen } from './screens/ScoreScreen';
import { TrainerScreen } from './screens/TrainerScreen';
import { SentenceEditorScreen } from './screens/SentenceEditorScreen';
import { EditorView } from './components/EditorView';
import { UsageLogScreen } from './screens/UsageLogScreen';
import { ZinsdeellabScreen } from './screens/ZinsdeellabScreen';
import LoginScreen from './components/LoginScreen';
import { preloadCommonLevels } from './data/sentenceLoader';
import { decodeShared } from './data/customSentenceStore';
import { StudentDashboardScreen } from './screens/StudentDashboardScreen';
import { TeacherDashboardScreen } from './screens/TeacherDashboardScreen';
import type { Sentence } from './types';

// Decode teacher-shared sentences from ?zinnen= URL param
const sharedParam = new URLSearchParams(window.location.search).get('zinnen');
const initialSharedSentences: Sentence[] = sharedParam ? decodeShared(sharedParam) : [];

export default function App() {
  const trainer = useTrainer();
  const [showLogin, setShowLogin] = useState(() => window.location.hash === '#/login');
  const [showEditor, setShowEditor] = useState(() => window.location.hash === '#/editor');
  const [showDocent, setShowDocent] = useState(() => window.location.hash === '#/docent');
  const [showUsageLog, setShowUsageLog] = useState(() => window.location.hash === '#/usage');
  const [showZinsdeellab, setShowZinsdeellab] = useState(() => window.location.hash === '#/zinnenlab');
  const [showStudentDashboard, setShowStudentDashboard] = useState(() => window.location.hash === '#/mijn-voortgang');
  const [showTeacherDashboard, setShowTeacherDashboard] = useState(() => window.location.hash === '#/docent-dashboard');
  const [sharedSentences] = useState<Sentence[]>(initialSharedSentences);

  // Preload common sentence levels
  useEffect(() => {
    preloadCommonLevels();
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const onHashChange = () => {
      setShowLogin(window.location.hash === '#/login');
      setShowEditor(window.location.hash === '#/editor');
      setShowDocent(window.location.hash === '#/docent');
      setShowUsageLog(window.location.hash === '#/usage');
      setShowZinsdeellab(window.location.hash === '#/zinnenlab');
      setShowStudentDashboard(window.location.hash === '#/mijn-voortgang');
      setShowTeacherDashboard(window.location.hash === '#/docent-dashboard');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Login screen
  if (showLogin) {
    return <LoginScreen />;
  }

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

  // Student dashboard (#/mijn-voortgang)
  if (showStudentDashboard) {
    return (
      <StudentDashboardScreen
        studentName={trainer.studentName}
        studentInitiaal={trainer.studentInitiaal}
        studentKlas={trainer.studentKlas}
        darkMode={trainer.darkMode}
        onBack={() => {
          window.location.hash = '';
          setShowStudentDashboard(false);
        }}
      />
    );
  }

  // Teacher dashboard (#/docent-dashboard)
  if (showTeacherDashboard) {
    return (
      <TeacherDashboardScreen
        darkMode={trainer.darkMode}
        onBack={() => {
          window.location.hash = '';
          setShowTeacherDashboard(false);
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

  // Zinsdeellab screen (hidden route — #/zinnenlab)
  // availableSentences wordt doorgegeven zodat de corpusGrouper automatisch
  // Zinnenlab-frames en -kaarten genereert vanuit het bestaande corpus.
  if (showZinsdeellab) {
    return (
      <ZinsdeellabScreen
        darkMode={trainer.darkMode}
        largeFont={trainer.largeFont}
        dyslexiaMode={trainer.dyslexiaMode}
        studentName={trainer.studentName}
        studentKlas={trainer.studentKlas}
        sentences={trainer.availableSentences}
        onBuiltSentence={(sentence) => {
          setShowZinsdeellab(false);
          window.location.hash = '';
          trainer.startSharedSession([sentence]);
        }}
        onClose={() => {
          setShowZinsdeellab(false);
          window.location.hash = '';
        }}
      />
    );
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
        startSelectedSession={trainer.startSelectedSession}
        startJsonSession={trainer.startJsonSession}
        handleQuickStart={trainer.handleQuickStart}
        studentName={trainer.studentName}
        studentInitiaal={trainer.studentInitiaal}
        studentKlas={trainer.studentKlas}
        setStudentInfo={trainer.setStudentInfo}
        hasStudentInfo={trainer.hasStudentInfo}
        adaptiveMode={trainer.adaptiveMode}
        setAdaptiveMode={trainer.setAdaptiveMode}
        ladderEnabled={trainer.ladderEnabled}
        setLadderEnabled={trainer.setLadderEnabled}
        ladderStage={trainer.ladderStage}
        setLadderStage={trainer.setLadderStage}
        openSecretDocentRoute={() => {
          window.location.hash = '#/docent';
          setShowDocent(true);
        }}
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
        sessionSource={trainer.sessionSource}
        autoSendStatus={trainer.autoSendStatus}
        autoSendError={trainer.autoSendError}
        studentName={trainer.studentName}
        studentInitiaal={trainer.studentInitiaal}
        studentKlas={trainer.studentKlas}
        ladderEnabled={trainer.ladderEnabled}
        ladderStage={trainer.ladderStage}
        ladderPromotion={trainer.ladderPromotion}
      />
    );
  }

  // Trainer Screen: active exercise
  return (
    <TrainerScreen
      currentSentence={trainer.currentSentence} step={trainer.step} mode={trainer.mode}
      splitIndices={trainer.splitIndices} chunkLabels={trainer.chunkLabels} subLabels={trainer.subLabels} bijzinFunctieLabels={trainer.bijzinFunctieLabels}
      bijvBepLinks={trainer.bijvBepLinks} linkingBijvBepId={trainer.linkingBijvBepId}
      wordBijvBepLinks={trainer.wordBijvBepLinks} linkingWordTokenId={trainer.linkingWordTokenId}
      validationResult={trainer.validationResult} showAnswerMode={trainer.showAnswerMode} hintMessage={trainer.hintMessage}
      hasBeenScored={trainer.hasBeenScored} allLabeled={trainer.allLabeled}
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
      isDragging={trainer.isDragging} handleDragStart={trainer.handleDragStart} handleDragEnd={trainer.handleDragEnd} handleDropChunk={trainer.handleDropChunk} handleDropWord={trainer.handleDropWord}
      removeLabel={trainer.removeLabel} removeSubLabel={trainer.removeSubLabel}
      handleDropBijzinFunctie={trainer.handleDropBijzinFunctie} removeBijzinFunctieLabel={trainer.removeBijzinFunctieLabel}
      startBijvBepLinking={trainer.startBijvBepLinking} completeBijvBepLink={trainer.completeBijvBepLink} cancelBijvBepLinking={trainer.cancelBijvBepLinking} removeBijvBepLink={trainer.removeBijvBepLink}
      completeWordBijvBepLink={trainer.completeWordBijvBepLink} cancelWordBijvBepLinking={trainer.cancelWordBijvBepLinking}
      handleHint={trainer.handleHint} handleCheck={trainer.handleCheck}
      handleShowAnswerRequest={trainer.handleShowAnswerRequest} handleRetry={trainer.handleRetry} handleAbortRequest={trainer.handleAbortRequest} handleConfirmAction={trainer.handleConfirmAction}
      nextSessionSentence={trainer.nextSessionSentence}
      consecutivePerfect={trainer.consecutivePerfect}
      selectedRole={trainer.selectedRole}
      handleSelectRole={trainer.handleSelectRole}
      handleClearSelectedRole={trainer.handleClearSelectedRole}
      handleTapPlaceChunk={trainer.handleTapPlaceChunk}
      handleTapPlaceWord={trainer.handleTapPlaceWord}
      handleTouchDrop={trainer.handleTouchDrop}
      ladderEnabled={trainer.ladderEnabled}
      ladderStage={trainer.ladderStage}
      ladderActiveRoles={trainer.ladderActiveRoles}
      ladderPromotion={trainer.ladderPromotion}
      handleSkipSplitStep={trainer.handleSkipSplitStep}
    />
  );
}
