import { useState } from 'react';
import { useZinsbouwlab } from '../hooks/useZinsbouwlab';
import { ROLES } from '../constants';
import { FrameSlot } from '../components/FrameSlot';
import { ChunkBank } from '../components/ChunkBank';
import { logInteraction } from '../services/interactionLog';
import { logLabEvent } from '../services/labActivityLog';
import { saveSubmission, generateSubmissionId } from '../services/labSubmissionStore';
import type { ConstructionFrame, FrameSlotKey, Sentence, ChunkCard } from '../types';

type ScreenPhase = 'welkom' | 'menu' | 'frame-select' | 'bouwen' | 'validatie';

interface ZinsdeellabScreenProps {
  darkMode: boolean;
  largeFont: boolean;
  dyslexiaMode: boolean;
  studentName: string;
  studentKlas: string;
  /**
   * Alle beschikbare zinnen uit het corpus (gefilterd of niet).
   * Worden doorgegeven aan useZinsbouwlab zodat de corpusGrouper automatisch
   * Zinnenlab-frames en -kaarten kan genereren.
   * Geef [] door als de zinnen nog niet geladen zijn.
   */
  sentences: Sentence[];
  onBuiltSentence: (sentence: Sentence) => void;
  onClose: () => void;
}

function slotColor(slot: FrameSlotKey): string {
  const role = ROLES.find(r => r.key === slot);
  return role?.colorClass ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
}

function slotLabel(slot: FrameSlotKey): string {
  const role = ROLES.find(r => r.key === slot);
  return role?.label ?? slot.toUpperCase();
}

export function ZinsdeellabScreen({
  darkMode,
  largeFont,
  dyslexiaMode,
  studentName,
  studentKlas,
  sentences,
  onBuiltSentence,
  onClose,
}: ZinsdeellabScreenProps) {
  // Geef sentences door zodat de corpusGrouper automatisch frames en kaarten genereert
  const lab = useZinsbouwlab(sentences);
  const [phase, setPhase] = useState<ScreenPhase>(() => studentName.trim() ? 'menu' : 'welkom');
  const [localName, setLocalName] = useState(studentName);
  const [localKlas, setLocalKlas] = useState(studentKlas);
  const [submissionId] = useState(() => generateSubmissionId());

  // ── Welkom ─────────────────────────────────────────────────────────────────

  function handleWelkomStart() {
    try {
      const current = JSON.parse(localStorage.getItem('student_info_v1') ?? '{}');
      localStorage.setItem('student_info_v1', JSON.stringify({
        ...current,
        name: localName.trim(),
        klas: localKlas.trim(),
      }));
    } catch { /* ignore */ }
    setPhase('menu');
  }

  // ── Navigatie ──────────────────────────────────────────────────────────────

  function handleSelectFrame(frame: ConstructionFrame) {
    lab.setActiveFrame(frame);
    setPhase('bouwen');
    logInteraction('lab_exercise_start');
    logLabEvent({
      submissionId,
      type: 'exercise_start',
      timestamp: new Date().toISOString(),
      detail: frame.id,
    });
  }

  function handleBack() {
    if (phase === 'validatie') {
      setPhase('bouwen');
    } else if (phase === 'bouwen') {
      lab.reset();
      setPhase('frame-select');
    } else if (phase === 'frame-select') {
      setPhase('menu');
    } else if (phase === 'menu') {
      setPhase('welkom');
    } else {
      onClose();
    }
  }

  // ── Tap-to-place ───────────────────────────────────────────────────────────

  function handleCardTap(card: ChunkCard) {
    const slot = card.role as FrameSlotKey;
    if (!lab.activeFrame?.slots.includes(slot)) return;
    lab.placeCard(slot, card);
    logLabEvent({
      submissionId,
      type: 'card_placed',
      timestamp: new Date().toISOString(),
      detail: `${slot}:${card.id}`,
    });
  }

  function handleRemoveCard(slot: FrameSlotKey) {
    lab.removeCard(slot);
    logLabEvent({
      submissionId,
      type: 'card_removed',
      timestamp: new Date().toISOString(),
      detail: slot,
    });
  }

  // ── Drag-and-drop ──────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, card: ChunkCard) {
    e.dataTransfer.setData('text/card-id', card.id);
    e.dataTransfer.setData('text/slot', card.role);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetSlot: FrameSlotKey) {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/card-id');
    // Accept drop from any slot bank whose cards match this slot
    const allCards = [...lab.cardsForSlot(targetSlot)];
    const card = allCards.find(c => c.id === cardId);
    if (card) {
      lab.placeCard(targetSlot, card);
      logLabEvent({
        submissionId,
        type: 'card_placed',
        timestamp: new Date().toISOString(),
        detail: `${targetSlot}:${cardId}`,
      });
    }
  }

  // ── Controleer & Ontleed ───────────────────────────────────────────────────

  function handleControleer() {
    const result = lab.runCheck();
    setPhase('validatie');
    logInteraction('lab_construction_submit');
    logLabEvent({
      submissionId,
      type: result.ok ? 'construction_valid' : 'construction_invalid',
      timestamp: new Date().toISOString(),
    });
  }

  function handleOntleed() {
    const sentence = lab.buildSentence();
    if (!sentence || !lab.activeFrame) return;

    const renderedSentence = sentence.tokens.map(t => t.text).join(' ');

    saveSubmission({
      id: submissionId,
      exerciseId: lab.activeFrame.id,
      exerciseVersion: 1,
      studentName: localName,
      studentKlas: localKlas,
      startedAt: new Date().toISOString(),
      constructionValid: true,
      builtSentence: renderedSentence,
      usedHint: false,
    });

    logInteraction('lab_exercise_complete');
    logLabEvent({
      submissionId,
      type: 'parse_started',
      timestamp: new Date().toISOString(),
    });

    onBuiltSentence(sentence);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const placedCardIds = new Set(
    (Object.values(lab.placedCards) as Array<ChunkCard | undefined>)
      .filter((c): c is ChunkCard => c !== undefined)
      .map(c => c.id)
  );

  const allRequiredPlaced = lab.activeFrame
    ? lab.activeFrame.slots.every(slot => !!lab.placedCards[slot])
    : false;

  // Sentence preview follows orderedSlots (tap order = word order)
  const builtSentenceText = lab.orderedSlots
    .map(slot => lab.placedCards[slot]?.tokens.map(t => t.text).join(' '))
    .filter(Boolean)
    .join(' ');

  // Display order: placed chips in tap order, then remaining empty slots
  const displaySlots = lab.activeFrame
    ? [
        ...lab.orderedSlots,
        ...lab.activeFrame.slots.filter(s => !lab.orderedSlots.includes(s)),
      ]
    : [];

  const base = [
    'min-h-screen flex flex-col',
    darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900',
    largeFont ? 'text-lg' : 'text-base',
    dyslexiaMode ? 'font-mono' : '',
  ].join(' ');

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className={base}>
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <button
          onClick={handleBack}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          aria-label="Terug"
        >
          ← Terug
        </button>
        <h1 className="font-bold text-xl">Zinnenlab</h1>
        <div className="ml-auto flex items-center gap-3">
          {lab.activeFrame && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs hidden sm:block">
              {lab.activeFrame.label}
            </span>
          )}
          {localName && (
            <button
              onClick={() => setPhase('welkom')}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Naam wijzigen"
            >
              {localName} ✎
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">

        {/* ── WELKOM ── */}
        {phase === 'welkom' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zinnenlab</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Kies een zinspatroon, plak de zinsdelen op de juiste plek en bouw een correcte zin.
                  Daarna ontleed je de zin die je zelf hebt gemaakt.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Naam *</span>
                  <input
                    value={localName}
                    onChange={e => setLocalName(e.target.value)}
                    placeholder="Jouw naam"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Klas</span>
                  <input
                    value={localKlas}
                    onChange={e => setLocalKlas(e.target.value)}
                    placeholder="b.v. 2A"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>
              </div>

              <button
                onClick={handleWelkomStart}
                disabled={!localName.trim()}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-base hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 transition"
              >
                Aan de slag →
              </button>
            </div>
          </div>
        )}

        {/* ── MENU ── */}
        {phase === 'menu' && (
          <>
            <p className="text-gray-600 dark:text-gray-400">
              Kies een oefenvorm om een zin te bouwen.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setPhase('frame-select')}
                className="text-left p-5 rounded-xl border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 focus-visible:ring-2 focus-visible:ring-blue-500 transition"
              >
                <div className="text-2xl mb-2">🧱</div>
                <div className="font-bold text-blue-800 dark:text-blue-200">Remixzin</div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Bouw een zin uit woordkaarten en ontleed daarna je eigen zin.
                </div>
              </button>
              {[
                { icon: '↔️', naam: 'Schuiflab', omschrijving: 'Schuif zinsdelen en ontdek inversie.' },
                { icon: '⚖️', naam: 'Contrast', omschrijving: 'Vergelijk twee bijna-gelijke zinnen.' },
              ].map(m => (
                <div
                  key={m.naam}
                  className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <div className="font-bold text-gray-500 dark:text-gray-400">{m.naam}</div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">{m.omschrijving}</div>
                  <div className="text-xs mt-2 text-gray-400">Binnenkort</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── FRAME-SELECT ── */}
        {phase === 'frame-select' && (
          <>
            <p className="text-gray-600 dark:text-gray-400">Kies een zinsbouwpatroon:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lab.frames.map(frame => (
                <button
                  key={frame.id}
                  onClick={() => handleSelectFrame(frame)}
                  className="text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{frame.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{frame.prompt}</div>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {frame.slots.map(slot => (
                      <span
                        key={slot}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${slotColor(slot)}`}
                      >
                        {ROLES.find(r => r.key === slot)?.shortLabel ?? slot.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── BOUWEN + VALIDATIE ── */}
        {(phase === 'bouwen' || phase === 'validatie') && lab.activeFrame && (
          <>
            {/* Opdracht */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {lab.activeFrame.prompt}
              </p>
              {phase === 'bouwen' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tik op een kaart om hem te plaatsen. De volgorde bepaalt de woordvolgorde van je zin.
                </p>
              )}
            </div>

            {/* Bouwbalk */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                Jouw zin
              </h2>
              <div className="flex flex-wrap gap-2">
                {displaySlots.map(slot => (
                  <FrameSlot
                    key={slot}
                    slot={slot}
                    slotLabel={slotLabel(slot)}
                    colorClass={slotColor(slot)}
                    placedCard={lab.placedCards[slot] ?? null}
                    isHighlighted={false}
                    onTapPlace={() => {}}
                    onRemove={() => handleRemoveCard(slot)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, slot)}
                    darkMode={darkMode}
                  />
                ))}
              </div>
              {builtSentenceText && (
                <p className="mt-3 text-gray-700 dark:text-gray-300 italic text-sm">
                  {builtSentenceText}
                </p>
              )}
            </div>

            {/* Woordbank — alleen tijdens bouwen */}
            {phase === 'bouwen' && (
              <div className="space-y-4">
                {lab.activeFrame.slots.map(slot => {
                  const cards = lab.cardsForSlot(slot);
                  if (cards.length === 0) return null;
                  return (
                    <div key={slot}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        {slotLabel(slot)}
                      </h3>
                      <ChunkBank
                        cards={cards}
                        placedCardIds={placedCardIds}
                        selectedCardId={null}
                        onCardTap={handleCardTap}
                        onDragStart={handleDragStart}
                        darkMode={darkMode}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Validatiefeedback */}
            {phase === 'validatie' && lab.checkResult && (
              <div className={`rounded-xl p-4 border ${
                lab.checkResult.ok
                  ? 'bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700'
                  : 'bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-700'
              }`}>
                {lab.checkResult.ok ? (
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    ✓ Je zin is grammaticaal correct! Je kunt hem nu ontleden.
                  </p>
                ) : (
                  <>
                    <p className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      Nog niet helemaal goed:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {lab.checkResult.feedback.map((fb, i) => (
                        <li key={i} className="text-sm text-red-700 dark:text-red-300">{fb}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Actieknoppen */}
            <div className="flex gap-3 flex-wrap">
              {phase === 'bouwen' && (
                <button
                  onClick={handleControleer}
                  disabled={!allRequiredPlaced}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                >
                  Controleer zin
                </button>
              )}
              {phase === 'validatie' && lab.checkResult && (
                lab.checkResult.ok ? (
                  <button
                    onClick={handleOntleed}
                    className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 transition"
                  >
                    Ga ontleden →
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      lab.reset();
                      setPhase('bouwen');
                    }}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                  >
                    Opnieuw proberen
                  </button>
                )
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
