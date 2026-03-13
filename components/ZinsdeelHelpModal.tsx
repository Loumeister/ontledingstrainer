
import React from 'react';

interface ZinsdeelHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ZINSDEEL_INFO = [
  {
    shortLabel: 'PV',
    label: 'Persoonsvorm',
    description: 'Het werkwoord dat verandert als je de zin in een andere tijd zet.',
    question: 'Tijdsproef: zet de zin in een andere tijd – welk woord verandert mee?',
    colorClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700',
  },
  {
    shortLabel: 'OW',
    label: 'Onderwerp',
    description: 'Het zinsdeel dat de handeling uitvoert.',
    question: 'Wie of wat + PV?',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700',
  },
  {
    shortLabel: 'WG',
    label: 'Werkwoordelijk Gezegde',
    description: 'Alle werkwoorden in de zin samen (inclusief de PV). Gebruikt bij een zelfstandig werkwoord.',
    question: 'Welke werkwoorden staan er in de zin?',
    colorClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-100 dark:border-rose-600',
  },
  {
    shortLabel: 'NG',
    label: 'Naamwoordelijk Gezegde',
    description: 'Zegt iets over het onderwerp, na een koppelwerkwoord (zijn, worden, lijken, schijnen, blijven).',
    question: 'Is er een koppelwerkwoord? Wat wordt er over het OW gezegd?',
    colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-600',
  },
  {
    shortLabel: 'LV',
    label: 'Lijdend Voorwerp',
    description: 'Het zinsdeel dat de handeling ondergaat.',
    question: 'Wie of wat + gezegde + OW?',
    colorClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700',
  },
  {
    shortLabel: 'MV',
    label: 'Meewerkend Voorwerp',
    description: 'De ontvanger van de handeling.',
    question: 'Aan/voor wie + gezegde + OW + LV?',
    colorClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700',
  },
  {
    shortLabel: 'BWB',
    label: 'Bijwoordelijke Bepaling',
    description: 'Geeft extra informatie over de handeling.',
    question: 'Hoe? Waar? Wanneer? Waarom?',
    colorClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700',
  },
  {
    shortLabel: 'VZV',
    label: 'Voorzetselvoorwerp',
    description: 'Een voorzetsel dat vast bij het werkwoord hoort (bijv. wachten op, denken aan).',
    question: 'Hoort het voorzetsel vast bij het werkwoord?',
    colorClass: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700',
  },
  {
    shortLabel: 'BIJZIN',
    label: 'Bijzin',
    description: 'Een deel van de zin met een eigen onderwerp en persoonsvorm, vaak ingeleid door een voegwoord.',
    question: 'Bevat dit deel een eigen OW en PV?',
    colorClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-fuchsia-900/40 dark:text-fuchsia-100 dark:border-fuchsia-700',
  },
  {
    shortLabel: 'BIJST',
    label: 'Bijstelling',
    description: 'Hernoemt een ander zinsdeel, staat vaak tussen komma\'s.',
    question: 'Staat er extra uitleg tussen komma\'s die een zinsdeel hernoemt?',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-700',
  },
];

export const ZinsdeelHelpModal: React.FC<ZinsdeelHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="zinsdeel-help-modal-title"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 id="zinsdeel-help-modal-title" className="text-2xl font-extrabold text-slate-800 dark:text-white">📖 Overzicht Zinsdelen</h2>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Gebruik de vragen om elk zinsdeel te herkennen. Werk altijd van boven naar beneden.
          </p>
          {ZINSDEEL_INFO.map((item) => (
            <div
              key={item.shortLabel}
              className={`flex items-start gap-3 p-3 rounded-xl border ${item.colorClass}`}
            >
              <span className="font-extrabold text-sm min-w-[3.5rem] text-center pt-0.5">{item.shortLabel}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{item.label}</p>
                <p className="text-xs mt-0.5 opacity-80">{item.description}</p>
                <p className="text-xs mt-1 italic opacity-70">Vraag: {item.question}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
