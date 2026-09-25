import React, { useMemo, useState } from 'react';
import { ROLES } from '../constants';
import { PlacementMap, RoleKey, Sentence, Token } from '../types';
import { buildUserChunks, computeCorrectSplits, ValidationResult } from '../logic/validation';
import { checkBijzinAnalyse } from '../logic/bijzinAnalysis';
import { logInteraction } from '../services/interactionLog';
import { FeedbackPanel, FeedbackItem } from './FeedbackPanel';

/** Roles a student can choose inside a bijzin. The onderschikkend voegwoord is its own zinsdeel here. */
const BIJZIN_ROLE_KEYS: RoleKey[] = ['vw_onder', 'pv', 'ow', 'lv', 'mv', 'vv', 'bwb', 'wg', 'ng'];
const BIJZIN_ROLES = BIJZIN_ROLE_KEYS.map(key => ROLES.find(r => r.key === key)!).filter(Boolean);

interface BijzinAnalysePanelProps {
  /** The bijzin as a sentence of its own (see buildBijzinSentence). */
  bijzin: Sentence;
  /** All words of the bijzin as they appear in the main sentence, including words that are not asked. */
  allTokens: Token[];
  isLargeFont?: boolean;
}

const stateClasses = (state?: string | null) => {
  if (state === 'correct') return 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600';
  if (state === 'warning') return 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600';
  if (state === 'incorrect-role' || state === 'incorrect-split') return 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600';
  return 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600';
};

/**
 * Opens under the main sentence once the bijzin has been found: the student splits and labels the
 * bijzin as a sentence of its own. Checked with the same validateAnswer as the main sentence.
 */
export const BijzinAnalysePanel: React.FC<BijzinAnalysePanelProps> = ({ bijzin, allTokens, isLargeFont }) => {
  const [splits, setSplits] = useState<Set<number>>(new Set());
  const [labels, setLabels] = useState<PlacementMap>({});
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [answerShown, setAnswerShown] = useState(false);

  const chunks = useMemo(() => buildUserChunks(bijzin.tokens, splits), [bijzin, splits]);
  const askedIds = new Set(bijzin.tokens.map(t => t.id));
  const notAsked = allTokens.filter(t => !askedIds.has(t.id));
  const locked = answerShown || !!result?.isPerfect;

  const toggleSplit = (index: number) => {
    if (locked) return;
    setSplits(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
    setResult(null);
  };

  const setLabel = (chunkId: string, role: string) => {
    if (locked) return;
    setLabels(prev => {
      const next = { ...prev };
      if (role) next[chunkId] = role as RoleKey; else delete next[chunkId];
      return next;
    });
    setResult(null);
  };

  const check = () => {
    const { result: r } = checkBijzinAnalyse(bijzin, allTokens, splits, labels);
    setResult(r);
    logInteraction('bijzin_analyse_check', bijzin.id, `start=${bijzin.tokens[0].id},perfect=${r.isPerfect}`);
  };

  const showAnswer = () => {
    const correctSplits = computeCorrectSplits(bijzin.tokens);
    const correctLabels: PlacementMap = {};
    buildUserChunks(bijzin.tokens, correctSplits).forEach(c => { correctLabels[c.tokens[0].id] = c.tokens[0].role; });
    setSplits(correctSplits);
    setLabels(correctLabels);
    setResult(null);
    setAnswerShown(true);
    logInteraction('bijzin_analyse_show_answer', bijzin.id, `start=${bijzin.tokens[0].id}`);
  };

  const allLabeled = chunks.every(c => !!labels[c.tokens[0].id]);
  const feedbackItems: FeedbackItem[] = result && !result.isPerfect
    ? chunks
        .map((c, idx) => ({ chunkWords: c.tokens.map(t => t.text).join(' '), feedback: result.chunkFeedback[idx], state: result.chunkStatus[idx] }))
        .filter((item): item is FeedbackItem => !!item.feedback)
    : [];
  const wordClass = isLargeFont ? 'text-xl' : 'text-base';

  return (
    <section
      aria-label="Bijzin ontleden"
      className="w-full rounded-xl border border-purple-200 dark:border-fuchsia-800 bg-purple-50/60 dark:bg-fuchsia-900/10 p-3 md:p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div>
        <p className="text-xs font-bold text-purple-700 dark:text-fuchsia-300 uppercase tracking-wider">Ontleed de bijzin</p>
        <p className={`${wordClass} font-medium text-slate-800 dark:text-slate-100 mt-1`}>"{allTokens.map(t => t.text).join(' ')}"</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Knip de bijzin in zinsdelen en benoem elk deel, net als bij een gewone zin.
          {notAsked.length > 0 && <> {notAsked.length > 1 ? 'De woorden' : 'Het woord'} <strong>'{notAsked.map(t => t.text).join(' ')}'</strong> hoef je niet te benoemen.</>}
        </p>
      </div>

      {/* Knippen */}
      <div className="flex flex-wrap items-center gap-1" aria-label="Knippen in de bijzin">
        {bijzin.tokens.map((t, i) => (
          <React.Fragment key={t.id}>
            <span className={`${wordClass} px-1 text-slate-800 dark:text-slate-100`}>{t.text}</span>
            {i < bijzin.tokens.length - 1 && (
              <button
                type="button"
                onClick={() => toggleSplit(i)}
                disabled={locked}
                aria-pressed={splits.has(i)}
                aria-label={splits.has(i) ? `Knip na '${t.text}' weghalen` : `Knip na '${t.text}'`}
                className={`w-5 h-7 rounded text-sm font-bold transition-colors disabled:cursor-not-allowed ${splits.has(i) ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 hover:bg-purple-100 dark:hover:bg-fuchsia-900'}`}
              >|</button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Benoemen */}
      <div className="flex flex-wrap gap-2">
        {chunks.map((c, idx) => {
          const chunkId = c.tokens[0].id;
          const words = c.tokens.map(t => t.text).join(' ');
          return (
            <label key={chunkId} className={`flex flex-col gap-1 rounded-lg border-2 px-3 py-2 ${stateClasses(result?.chunkStatus[idx])}`}>
              <span className={`${wordClass} text-slate-800 dark:text-slate-100`}>{words}</span>
              <select
                value={labels[chunkId] ?? ''}
                onChange={e => setLabel(chunkId, e.target.value)}
                disabled={locked}
                aria-label={`Zinsdeel voor '${words}'`}
                className="text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-1 py-0.5"
              >
                <option value="">Kies…</option>
                {BIJZIN_ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
          );
        })}
      </div>

      {result?.isPerfect && (
        <p className="text-sm font-bold text-green-700 dark:text-green-300">Goed! Je hebt de bijzin helemaal goed ontleed.</p>
      )}
      {answerShown && (
        <p className="text-sm text-slate-600 dark:text-slate-300">Dit is de juiste ontleding van de bijzin.</p>
      )}
      {result && !result.isPerfect && (
        <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
          Je hebt {result.score} van de {result.total} delen van de bijzin goed. Bekijk de feedback en probeer het opnieuw.
        </p>
      )}
      {feedbackItems.length > 0 && <FeedbackPanel items={feedbackItems} isLargeFont={isLargeFont} />}

      {!locked && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={check}
            disabled={!allLabeled}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >Controleer bijzin</button>
          {result && !result.isPerfect && (
            <button
              type="button"
              onClick={showAnswer}
              className="px-4 py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-medium"
            >Toon antwoord bijzin</button>
          )}
        </div>
      )}
    </section>
  );
};
