import React, { useRef, useState, useMemo } from 'react';
import { DifficultyLevel, Sentence } from '../types';
import { HelpModal } from '../components/HelpModal';
import { SentencePicker } from '../components/SentencePicker';
import { TrainerState } from '../hooks/useTrainer';
import { importCustomSentences, getCustomSentences, parseAndValidateSentences } from '../data/customSentenceStore';
import { LEVEL_NAMES, LEVEL_SUMMARIES, LEVEL_TOOLTIPS, ROLES } from '../constants';
import { PredicateMode } from '../logic/sentenceFilter';
import { nextRadioIndex } from '../logic/radioKeys';
import { getPreviousScore, getStreak } from '../services/sessionHistory';
import { getLadderStage, LADDER_STAGES } from '../logic/rollenladder';

type HomeScreenProps = Pick<TrainerState,
  | 'predicateMode' | 'setPredicateMode'
  | 'selectedLevel' | 'setSelectedLevel'
  | 'customSessionCount' | 'setCustomSessionCount'
  | 'focusLV' | 'setFocusLV'
  | 'focusMV' | 'setFocusMV'
  | 'includeVV' | 'setIncludeVV'
  | 'includeBB' | 'setIncludeBB'
  | 'showHelp' | 'setShowHelp'
  | 'darkMode' | 'setDarkMode'
  | 'largeFont' | 'setLargeFont'
  | 'dyslexiaMode' | 'setDyslexiaMode'
  | 'availableSentences'
  | 'isLoadingSentences'
  | 'sentenceLoadError'
  | 'refreshCustomSentences'
  | 'startSession'
  | 'handleSentenceSelect'
  | 'startSharedSession'
  | 'startSelectedSession'
  | 'startJsonSession'
  | 'handleQuickStart'
  | 'studentName' | 'studentInitiaal' | 'studentKlas' | 'setStudentInfo' | 'hasStudentInfo'
  | 'adaptiveMode' | 'setAdaptiveMode'
  | 'ladderEnabled'
  | 'ladderStage' | 'setLadderStage'
> & {
  sharedSentences: Sentence[];
  openSecretDocentRoute: () => void;
};

const LEVEL_OPTIONS: (DifficultyLevel | null)[] = [null, 0, 1, 2, 3, 4];
const ALL_LEVELS_SUMMARY = 'Instap tot en met Hoog door elkaar. Samengestelde zinnen zitten er niet bij.';
const levelName = (lvl: DifficultyLevel | null) => (lvl === null ? 'Alles' : LEVEL_NAMES[lvl]);

const PREDICATE_OPTIONS: { mode: PredicateMode; title: string; short: string; hint: string; activeClass: string }[] = [
  { mode: 'WG', title: 'Werkwoordelijk (WG)', short: 'Werkwoordelijk', hint: 'Alleen zinnen met een WG', activeClass: 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100' },
  { mode: 'NG', title: 'Naamwoordelijk (NG)', short: 'Naamwoordelijk', hint: 'Alleen zinnen met een NG', activeClass: 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-100' },
  { mode: 'ALL', title: 'Allebei', short: 'WG en NG', hint: 'WG en NG door elkaar', activeClass: 'bg-indigo-50 border-indigo-500 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-100' },
];

/** Pijltjesbediening voor een radiogroep van knoppen: kiest en focust de nieuwe optie. */
function handleRadioKeyDown<T>(e: React.KeyboardEvent<HTMLButtonElement>, options: T[], index: number, select: (v: T) => void) {
  const next = nextRadioIndex(e.key, index, options.length);
  if (next === null) return;
  e.preventDefault();
  select(options[next]);
  (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
}

const StepHeading: React.FC<{ id: string; number: number; title: string; hint?: string }> = ({ id, number, title, hint }) => (
  <div className="mb-3">
    <h2 id={id} className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center" aria-hidden="true">{number}</span>
      {title}
    </h2>
    {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-8">{hint}</p>}
  </div>
);

const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; labelledBy: string }> = ({ checked, onChange, labelledBy }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby={labelledBy}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${checked ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
  >
    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const ToggleCard: React.FC<{
  title: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onText: string;
  offText: string;
  note?: string;
}> = ({ title, checked, onChange, onText, offText, note }) => {
  const labelId = `toggle-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`rounded-xl border-2 p-4 transition-colors ${checked ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20' : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'}`}>
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className="font-bold text-slate-800 dark:text-slate-100">{title}</span>
        <Switch checked={checked} onChange={onChange} labelledBy={labelId} />
      </div>
      <p className={`mt-1.5 text-sm ${checked ? 'text-green-800 dark:text-green-200' : 'text-slate-500 dark:text-slate-400'}`}>
        <span className="font-bold">{checked ? 'Aan' : 'Uit'}:</span> {checked ? onText : offText}
      </p>
      {note && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{note}</p>}
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  predicateMode, setPredicateMode,
  selectedLevel, setSelectedLevel,
  customSessionCount, setCustomSessionCount,
  focusLV, setFocusLV,
  focusMV, setFocusMV,
  includeVV, setIncludeVV,
  includeBB, setIncludeBB,
  showHelp, setShowHelp,
  darkMode, setDarkMode,
  largeFont, setLargeFont,
  dyslexiaMode, setDyslexiaMode,
  availableSentences,
  isLoadingSentences,
  sentenceLoadError,
  refreshCustomSentences,
  startSession,
  handleSentenceSelect,
  startSharedSession,
  startSelectedSession,
  startJsonSession,
  handleQuickStart,
  studentName,
  studentInitiaal,
  studentKlas,
  setStudentInfo,
  hasStudentInfo,
  adaptiveMode, setAdaptiveMode,
  ladderEnabled,
  ladderStage, setLadderStage,
  sharedSentences,
  openSecretDocentRoute,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const customCount = getCustomSentences().length;
  const sessionSize = Math.max(1, Math.min(customSessionCount, availableSentences.length));

  // Rollen die in de huidige zinvoorraad voorkomen, in de vaste ROLES-volgorde.
  const availableRoles = useMemo(() => {
    const present = new Set<string>();
    for (const s of availableSentences) {
      for (const t of s.tokens) {
        present.add(t.role);
        if (t.subRole === 'bijv_bep' && includeBB) present.add(t.subRole);
      }
    }
    return ROLES.filter(r => present.has(r.key));
  }, [availableSentences, includeBB]);

  // Welcome card data — gelezen eenmalig bij mount; sessionHistory verandert niet
  // zolang HomeScreen getoond wordt, dus lege deps zijn correct.
  const previousScore = useMemo(() => getPreviousScore(), []);
  const streak = useMemo(() => getStreak(), []);
  const motivatieZin = (score: number): string => {
    if (score >= 80) return 'Geweldig gedaan — ga zo door!';
    if (score >= 50) return 'Goed bezig — nog even oefenen!';
    return 'Elke oefening telt — jij kan dit!';
  };

  // Name prompt state
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState(studentName);
  const [initiaalInput, setInitiaalInput] = useState(studentInitiaal);
  const [klasInput, setKlasInput] = useState(studentKlas);
  const [pendingAction, setPendingAction] = useState<{
    type: 'session' | 'quickstart' | 'shared' | 'select' | 'selected' | 'json';
    sentenceId?: number;
    sentenceIds?: number[];
    jsonSentences?: Sentence[];
  } | null>(null);

  const openNamePrompt = (action: typeof pendingAction) => {
    setPendingAction(action);
    setNameInput(studentName);
    setInitiaalInput(studentInitiaal);
    setKlasInput(studentKlas);
    setShowNamePrompt(true);
  };

  const requireNameThen = (action: 'session' | 'quickstart' | 'shared') => {
    if (hasStudentInfo) {
      if (action === 'session') startSession();
      else if (action === 'quickstart') handleQuickStart();
      else if (action === 'shared') startSharedSession(sharedSentences);
    } else {
      openNamePrompt({ type: action });
    }
  };

  const requireNameThenSelected = (sentenceIds: number[]) => {
    if (hasStudentInfo) {
      startSelectedSession(sentenceIds);
    } else {
      openNamePrompt({ type: 'selected', sentenceIds });
    }
  };

  const requireNameThenJson = (sentences: Sentence[]) => {
    if (hasStudentInfo) {
      startJsonSession(sentences);
    } else {
      openNamePrompt({ type: 'json', jsonSentences: sentences });
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !initiaalInput.trim() || !klasInput.trim()) return;
    setStudentInfo(nameInput, initiaalInput, klasInput);
    setShowNamePrompt(false);
    const action = pendingAction;
    // Trigger the pending action after a tick so localStorage is updated
    setTimeout(() => {
      if (!action) return;
      if (action.type === 'session') startSession();
      else if (action.type === 'quickstart') handleQuickStart();
      else if (action.type === 'shared') startSharedSession(sharedSentences);
      else if (action.type === 'select' && action.sentenceId != null) handleSentenceSelect(action.sentenceId);
      else if (action.type === 'selected' && action.sentenceIds) startSelectedSession(action.sentenceIds);
      else if (action.type === 'json' && action.jsonSentences) startJsonSession(action.jsonSentences);
      setPendingAction(null);
    }, 0);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importCustomSentences(text);
      refreshCustomSentences();
      setImportMsg(`${imported.length} zinnen toegevoegd aan je zinvoorraad.`);
      setTimeout(() => setImportMsg(null), 3000);
    } catch (err) {
      setImportMsg(`Fout: ${err instanceof Error ? err.message : 'Ongeldig bestand'}`);
      setTimeout(() => setImportMsg(null), 4000);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const jsonSessionRef = useRef<HTMLInputElement>(null);
  const handleJsonSession = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const sentences = parseAndValidateSentences(text);
      if (sentences.length === 0) {
        setImportMsg('Fout: het JSON-bestand bevat geen zinnen.');
        setTimeout(() => setImportMsg(null), 4000);
        return;
      }
      requireNameThenJson(sentences);
    } catch (err) {
      setImportMsg(`Fout: ${err instanceof Error ? err.message : 'Ongeldig bestand'}`);
      setTimeout(() => setImportMsg(null), 4000);
    } finally {
      if (jsonSessionRef.current) jsonSessionRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-4 font-sans flex items-center justify-center relative transition-colors duration-300">
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onSecretDocentAccess={openSecretDocentRoute}
      />

      {/* Name prompt overlay */}
      {showNamePrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleNameSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white text-center">Wie ben jij?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Vul je gegevens in zodat je docent kan zien hoe het gaat.</p>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Voornaam</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none"
                autoFocus
                placeholder="bijv. Emma"
                maxLength={30}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Initiaal</label>
                <input
                  type="text"
                  value={initiaalInput}
                  onChange={e => setInitiaalInput(e.target.value.slice(0, 1))}
                  className="w-16 px-3 py-2 text-sm text-center font-bold uppercase border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none"
                  placeholder="V"
                  maxLength={1}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Klas</label>
                <input
                  type="text"
                  value={klasInput}
                  onChange={e => setKlasInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none"
                  placeholder="bijv. 2ga"
                  maxLength={10}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!nameInput.trim() || !initiaalInput.trim() || !klasInput.trim()}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Klaar, laten we beginnen!
            </button>
          </form>
        </div>
      )}

      <main className="max-w-6xl w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg space-y-6 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Ontleedlab
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {hasStudentInfo ? (
                <>Hoi <strong className="text-slate-700 dark:text-slate-200">{studentName} {studentInitiaal}.</strong>{studentKlas ? <> <span className="text-slate-400 dark:text-slate-500">({studentKlas})</span></> : ''} — stel je training samen: <button onClick={() => openNamePrompt(null)} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 text-xs underline ml-1">(wijzig)</button></>
              ) : 'Stel je training samen:'}
            </p>
          </div>

          {/* Top Right Controls */}
          <div className="flex gap-2 mt-4 md:mt-0">
            <button onClick={() => setLargeFont(!largeFont)} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all border ${largeFont ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`} title="Groot lettertype" aria-label="Groot lettertype">aA</button>
            <button onClick={() => setDyslexiaMode(!dyslexiaMode)} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-all border ${dyslexiaMode ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-200' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`} title="Dyslexie-modus" aria-label="Dyslexie-modus">Dy</button>
            <button onClick={() => setDarkMode(!darkMode)} className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all" title={darkMode ? "Lichte modus" : "Donkere modus"} aria-label={darkMode ? "Lichte modus" : "Donkere modus"}>
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            <button onClick={() => setShowHelp(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors" title="Instructies" aria-label="Instructies">?</button>
          </div>
        </div>

        {/* Welkomstkaart */}
        {previousScore !== null ? (
          <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-100 dark:border-rose-800/40 p-5 flex items-start gap-4">
            <div className="text-3xl leading-none mt-0.5">✨</div>
            <div className="flex-1 min-w-0">
              {hasStudentInfo && (
                <p className="font-bold text-rose-500 dark:text-rose-300 text-lg mb-1">
                  Welkom terug, {studentName}!
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-rose-700 dark:text-rose-200 mb-1">
                <span>Vorige sessie: <strong>{previousScore}%</strong></span>
                {streak > 1 && <span>🔥 {streak}-dagenreeks</span>}
              </div>
              <p className="text-xs text-rose-400 dark:text-rose-300">{motivatieZin(previousScore)}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800/40 p-5 flex items-start gap-4">
            <div className="text-3xl leading-none mt-0.5">👋</div>
            <div>
              <p className="font-bold text-violet-700 dark:text-violet-200 text-lg mb-1">Welkom bij Ontleedlab!</p>
              <p className="text-sm text-violet-600 dark:text-violet-300">
                Je oefent zinsontleding in twee stappen: zinsdelen knippen en benoemen. Druk op <strong>Snel Starten</strong> om direct te beginnen.
              </p>
            </div>
          </div>
        )}

        {/* Shared sentences banner */}
        {sharedSentences.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Zinnen van je docent</p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Je docent heeft {sharedSentences.length} {sharedSentences.length === 1 ? 'zin' : 'zinnen'} voor je klaargezet.
            </p>
            <button
              onClick={() => requireNameThen('shared')}
              className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
            >
              Oefenen met docentzinnen
            </button>
          </div>
        )}

        {/* Quick Start */}
        <button
          onClick={() => requireNameThen('quickstart')}
          className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-xl shadow-lg transition-colors flex flex-col items-center"
        >
          <span className="text-xl font-bold">▶ Snel Starten</span>
          <span className="text-sm text-green-50">3 zinnen op je laatste niveau</span>
        </button>

        <div className="flex items-center gap-3 text-sm font-semibold text-slate-400 dark:text-slate-500" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          of stel zelf je training samen
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
          {/* Keuzes */}
          <div className="space-y-6">
            <section aria-labelledby="stap-niveau">
              <StepHeading id="stap-niveau" number={1} title="Kies je niveau" />
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-2" role="radiogroup" aria-labelledby="stap-niveau">
                {LEVEL_OPTIONS.map((lvl, i) => {
                  const active = selectedLevel === lvl;
                  const align = i === 0 ? 'left-0' : i >= LEVEL_OPTIONS.length - 2 ? 'right-0' : 'left-1/2 -translate-x-1/2';
                  return (
                    <button
                      key={lvl ?? 'all'}
                      role="radio"
                      aria-checked={active}
                      tabIndex={active ? 0 : -1}
                      aria-describedby="niveau-uitleg"
                      onClick={() => setSelectedLevel(lvl)}
                      onKeyDown={(e) => handleRadioKeyDown(e, LEVEL_OPTIONS, i, setSelectedLevel)}
                      className={`group relative py-2.5 text-sm font-bold rounded-lg border transition-all ${active ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700'}`}
                    >
                      {levelName(lvl)}
                      <span
                        role="tooltip"
                        className={`pointer-events-none absolute bottom-full mb-2 ${align} z-20 w-56 rounded-lg bg-slate-800 dark:bg-slate-950 px-3 py-2 text-left text-xs font-medium leading-snug text-white shadow-lg opacity-0 translate-y-1 transition-all delay-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0`}
                      >
                        <span className="block font-bold mb-0.5">{levelName(lvl)}</span>
                        {lvl === null ? ALL_LEVELS_SUMMARY : LEVEL_SUMMARIES[lvl]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p id="niveau-uitleg" className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                <strong className="text-slate-800 dark:text-slate-100">{levelName(selectedLevel)}:</strong>{' '}
                {selectedLevel === null ? ALL_LEVELS_SUMMARY : LEVEL_TOOLTIPS[selectedLevel]}
              </p>
            </section>

            <section aria-labelledby="stap-gezegde">
              <StepHeading id="stap-gezegde" number={2} title="Welk gezegde?" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-labelledby="stap-gezegde">
                {PREDICATE_OPTIONS.map((opt, i) => {
                  const active = predicateMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      role="radio"
                      aria-checked={active}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setPredicateMode(opt.mode)}
                      onKeyDown={(e) => handleRadioKeyDown(e, PREDICATE_OPTIONS.map(o => o.mode), i, setPredicateMode)}
                      className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${active ? opt.activeClass : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      <span className="block font-bold text-sm">{opt.title}</span>
                      <span className="block text-xs opacity-80">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="stap-onderdelen">
              <StepHeading id="stap-onderdelen" number={3} title="Moeilijke onderdelen" hint="Kies wat je al in de les hebt gehad." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ToggleCard
                  title="Voorzetselvoorwerp"
                  checked={includeVV}
                  onChange={setIncludeVV}
                  onText="Zit in je zinnen: altijd benoemen."
                  offText="Zinnen met een voorzetselvoorwerp worden overgeslagen."
                  note="Staat vanaf Hoog vanzelf aan."
                />
                <ToggleCard
                  title="Bijvoeglijke bepaling"
                  checked={includeBB}
                  onChange={setIncludeBB}
                  onText="Je benoemt ook de bijvoeglijke bepalingen binnen een zinsdeel."
                  offText="Hoef je niet te benoemen. De zinnen blijven hetzelfde."
                />
              </div>
            </section>

            <section aria-labelledby="stap-extra">
              <StepHeading id="stap-extra" number={4} title="Extra oefenen met" hint="Niet verplicht. Je krijgt dan alleen zinnen met dit zinsdeel." />
              <div className="flex flex-wrap gap-2">
                {(['lv', 'mv'] as const).map(key => {
                  const role = ROLES.find(r => r.key === key);
                  const active = key === 'lv' ? focusLV : focusMV;
                  return (
                    <button
                      key={key}
                      aria-pressed={active}
                      onClick={() => (key === 'lv' ? setFocusLV(!focusLV) : setFocusMV(!focusMV))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${active ? `${role?.colorClass} ${role?.borderColorClass} shadow-sm` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] ${active ? 'border-current' : 'border-slate-300 dark:border-slate-500'}`} aria-hidden="true">{active ? '✓' : ''}</span>
                      {role?.label}
                    </button>
                  );
                })}
              </div>
            </section>
            {/* Bestanden van de docent */}
            <section aria-labelledby="docent-bestand" className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
              <h2 id="docent-bestand" className="font-bold text-green-800 dark:text-green-200 mb-3">Bestand van je docent gekregen?</h2>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              <input ref={jsonSessionRef} type="file" accept=".json" onChange={handleJsonSession} className="hidden" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors">
                    Oefenzinnen toevoegen
                  </button>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    De zinnen komen bij je zinvoorraad.{customCount > 0 && <> Je hebt er nu {customCount} van je docent.</>}
                  </p>
                </div>
                <div>
                  <button onClick={() => jsonSessionRef.current?.click()} className="w-full px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors">
                    Toets openen
                  </button>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">Je start meteen met precies de zinnen uit het bestand.</p>
                </div>
              </div>
              {importMsg && (
                <p role="status" className={`mt-2 text-xs font-medium ${importMsg.startsWith('Fout') ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>{importMsg}</p>
              )}
            </section>
          </div>

          {/* Samenvatting & start */}
          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 space-y-4">
              <h2 className="font-bold text-blue-900 dark:text-blue-100 text-lg">Jouw training</h2>

              <dl className="text-sm space-y-1">
                <div className="flex justify-between gap-2"><dt className="text-blue-700/70 dark:text-blue-300/70">Niveau</dt><dd className="font-bold text-blue-900 dark:text-blue-100">{levelName(selectedLevel)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-blue-700/70 dark:text-blue-300/70">Gezegde</dt><dd className="font-bold text-blue-900 dark:text-blue-100">{PREDICATE_OPTIONS.find(o => o.mode === predicateMode)?.short}</dd></div>
              </dl>

              {availableRoles.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1.5">Deze zinsdelen kun je tegenkomen:</p>
                  <ul className="flex flex-wrap gap-1">
                    {availableRoles.map(r => (
                      <li key={r.key} title={r.label} className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${r.colorClass} ${r.borderColorClass}`}>{r.shortLabel}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isLoadingSentences ? (
                <p className="text-sm text-blue-500 dark:text-blue-300 font-medium">Zinnen laden...</p>
              ) : sentenceLoadError ? (
                <p className="text-sm text-red-600 dark:text-red-300 font-medium">{sentenceLoadError}</p>
              ) : availableSentences.length === 0 ? (
                <p className="text-sm rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2">Er zijn geen zinnen die bij al je keuzes passen. Kies een ander niveau of zet een keuze uit.</p>
              ) : availableSentences.length < customSessionCount ? (
                <p className="text-sm rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-3 py-2">Er passen maar {availableSentences.length} {availableSentences.length === 1 ? 'zin' : 'zinnen'} bij je keuzes.</p>
              ) : (
                <p className="text-xs text-blue-700/70 dark:text-blue-300/70">{availableSentences.length} zinnen passen bij je keuzes.</p>
              )}

              <div>
                <p id="aantal-label" className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1.5">Aantal zinnen</p>
                <div className="flex items-stretch gap-2" role="group" aria-labelledby="aantal-label">
                  <button onClick={() => setCustomSessionCount(Math.max(1, customSessionCount - 1))} disabled={customSessionCount <= 1} className="w-11 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-200 text-xl font-bold hover:bg-blue-100 dark:hover:bg-slate-700 disabled:opacity-40" aria-label="Minder zinnen">−</button>
                  <input type="number" min="1" max={Math.max(1, availableSentences.length)} value={customSessionCount} onChange={(e) => setCustomSessionCount(Math.max(1, Math.min(Math.max(1, availableSentences.length), parseInt(e.target.value) || 1)))} aria-labelledby="aantal-label" className="flex-1 min-w-0 px-3 py-2 text-lg font-bold text-center border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-100 rounded-lg focus:border-blue-500 outline-none" />
                  <button onClick={() => setCustomSessionCount(Math.min(Math.max(1, availableSentences.length), customSessionCount + 1))} disabled={customSessionCount >= availableSentences.length} className="w-11 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-200 text-xl font-bold hover:bg-blue-100 dark:hover:bg-slate-700 disabled:opacity-40" aria-label="Meer zinnen">+</button>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-800 p-3">
                <div>
                  <p id="slim-label" className="text-sm font-bold text-blue-900 dark:text-blue-100">Slim kiezen</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Je krijgt vaker zinnen met zinsdelen waar je eerder fouten mee maakte.</p>
                </div>
                <Switch checked={adaptiveMode} onChange={setAdaptiveMode} labelledBy="slim-label" />
              </div>

              {/* Hidden experiment: the route enables the ladder; no toggle leaks into the UI. */}
              {ladderEnabled && (() => {
                const stage = getLadderStage(ladderStage);
                return stage ? (
                  <div className="w-full p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700 text-xs text-indigo-800 dark:text-indigo-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Trede {ladderStage}/8: {stage.name}</span>
                      <button
                        onClick={() => setLadderStage(1)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 underline"
                      >
                        Reset
                      </button>
                    </div>
                    <p className="italic text-indigo-600 dark:text-indigo-300">{stage.question}</p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {LADDER_STAGES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setLadderStage(s.id)}
                          className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${s.id === ladderStage ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-700'}`}
                          title={s.name}
                        >
                          {s.id}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <button onClick={() => requireNameThen('session')} disabled={isLoadingSentences || availableSentences.length === 0} className="w-full py-3 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                {isLoadingSentences ? 'Laden...' : `Start met ${sessionSize} ${sessionSize === 1 ? 'zin' : 'zinnen'}`}
              </button>
            </div>

            <SentencePicker
              sentences={availableSentences}
              isLoading={isLoadingSentences}
              onStartSession={(ids) => requireNameThenSelected(ids)}
            />

          </aside>
        </div>

        <div className="text-center pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2">
          <button onClick={() => setShowHelp(true)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"><span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">i</span>Instructies & Uitleg</button>
        </div>
      </main>
    </div>
  );
};
