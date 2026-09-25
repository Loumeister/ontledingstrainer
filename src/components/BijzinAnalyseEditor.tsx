import React from 'react';
import { ROLES } from '../constants';
import type { RoleKey, Sentence, Token } from '../types';
import { BIJZIN_ROLE_KEYS, getLeerlingBijzin, isBijzinAnalyseAsked, isVerbindingswoordAsked } from '../logic/bijzinAnalysis';
import {
  BijzinEditState,
  bijzinEditChunks,
  setBijzinEditLabel,
  toggleBijzinEditSplit,
  toggleBijzinEditVerbindingswoord,
} from '../logic/bijzinEditor';
import { buildUserChunks, computeCorrectSplits } from '../logic/validation';

const BIJZIN_ROLES = BIJZIN_ROLE_KEYS.map(key => ROLES.find(r => r.key === key)!).filter(Boolean);
const EMPTY_STATE: BijzinEditState = { splits: [], labels: {}, verbindingswoord: [], kept: {} };

interface BijzinAnalyseEditorProps {
  /** The sentence as it will be saved, including the current bijzinAnalyse. */
  sentence: Sentence;
  /** The words of this bijzin in that sentence. */
  group: Token[];
  state: BijzinEditState;
  onChange: (state: BijzinEditState) => void;
}

/**
 * Lets the teacher enter the analysis of one bijzin: split between words, choose a zinsdeel per
 * part (same roles as the student's BijzinAnalysePanel) and mark verbindingswoorden. Below, a
 * preview derived with buildBijzinSentence shows what the student gets.
 */
export const BijzinAnalyseEditor: React.FC<BijzinAnalyseEditorProps> = ({ sentence, group, state, onChange }) => {
  const chunks = bijzinEditChunks(state, group.length);
  const functie = group[0].bijzinFunctie ? ROLES.find(r => r.key === group[0].bijzinFunctie) : undefined;
  const text = group.map(t => t.text).join(' ');
  const analyseAsked = isBijzinAnalyseAsked(sentence, group);
  const leerling = getLeerlingBijzin(sentence, group);
  const leerlingIds = new Set(leerling?.tokens.map(t => t.id));
  const nietGevraagd = leerling ? group.filter(t => !leerlingIds.has(t.id)) : [];
  const hasAnalyse = chunks.some((_, idx) => state.labels[idx]);

  return (
    <section aria-label={`Bijzin ontleden: ${text}`} className="rounded-xl border border-purple-200 dark:border-fuchsia-800 bg-purple-50/60 dark:bg-fuchsia-900/10 p-3 md:p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-purple-700 dark:text-fuchsia-300 uppercase tracking-wider">
            Bijzin{functie && <> · functie {functie.label}</>}
          </p>
          <p className="text-base font-medium text-slate-800 dark:text-slate-100 mt-1">"{text}"</p>
        </div>
        {hasAnalyse && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_STATE)}
            className="px-3 py-1 text-xs font-medium rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >Wis ontleding</button>
        )}
      </div>

      {!analyseAsked && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Op dit niveau ontleedt de leerling deze betrekkelijke bijzin niet. Je kunt de ontleding wel alvast invoeren.
        </p>
      )}

      {/* Knippen */}
      <div className="flex flex-wrap items-center gap-1" aria-label="Knippen in de bijzin">
        {group.map((t, i) => (
          <React.Fragment key={t.id}>
            <span className="text-base px-1 text-slate-800 dark:text-slate-100">{t.text}</span>
            {i < group.length - 1 && (
              <button
                type="button"
                onClick={() => onChange(toggleBijzinEditSplit(state, i, group.length))}
                aria-pressed={state.splits.includes(i)}
                aria-label={state.splits.includes(i) ? `Knip na '${t.text}' weghalen` : `Knip na '${t.text}'`}
                className={`w-5 h-7 rounded text-sm font-bold transition-colors ${state.splits.includes(i) ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 hover:bg-purple-100 dark:hover:bg-fuchsia-900'}`}
              >|</button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Benoemen en verbindingswoord */}
      <div className="flex flex-wrap gap-2">
        {chunks.map((chunk, idx) => {
          const words = chunk.map(i => group[i].text).join(' ');
          return (
            <div key={`${chunk[0]}-${idx}`} className="flex flex-col gap-1 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2">
              <label className="flex flex-col gap-1">
                <span className="text-base text-slate-800 dark:text-slate-100">{words}</span>
                <select
                  value={state.labels[idx] ?? ''}
                  onChange={e => onChange(setBijzinEditLabel(state, idx, (e.target.value || null) as RoleKey | null))}
                  aria-label={`Zinsdeel voor '${words}'`}
                  className="text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-1 py-0.5"
                >
                  <option value="">Kies…</option>
                  {BIJZIN_ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </label>
              {chunk.map(i => (
                <label key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={state.verbindingswoord.includes(i)}
                    onChange={() => onChange(toggleBijzinEditVerbindingswoord(state, i))}
                  />
                  '{group[i].text}' is verbindingswoord
                </label>
              ))}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Verbindingswoord: een betrekkelijk of vragend woord (<em>die, dat, waar, waardoor, waarom</em>) dat de bijzin verbindt en er ook een functie in heeft. Kies bij zo'n woord die functie, niet onderschikkend voegwoord.
      </p>

      {/* Voorbeeld voor de leerling */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 space-y-2">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zo ontleedt de leerling deze bijzin (niveau {sentence.level})</p>
        {leerling ? (
          <>
            <div className="flex flex-wrap gap-1">
              {buildUserChunks(leerling.tokens, computeCorrectSplits(leerling.tokens)).map(c => {
                const rd = ROLES.find(r => r.key === c.tokens[0].role);
                return (
                  <span key={c.tokens[0].id} className={`px-2 py-1 rounded text-xs font-medium border ${rd?.colorClass || ''} ${rd?.borderColorClass || ''}`}>
                    {c.tokens.map(t => t.text).join(' ')}
                    <span className="opacity-60 ml-1">{rd?.shortLabel}</span>
                  </span>
                );
              })}
            </div>
            {nietGevraagd.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Niet te benoemen{!isVerbindingswoordAsked(sentence) && ' (verbindingswoord, pas gevraagd op niveau 4)'}: {nietGevraagd.map(t => `'${t.text}'`).join(', ')}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            {analyseAsked
              ? 'Nog niet (volledig) ontleed. Zonder ontleding krijgt de leerling deze bijzin niet te ontleden.'
              : 'De leerling krijgt deze bijzin op dit niveau niet te ontleden.'}
          </p>
        )}
      </div>
    </section>
  );
};
