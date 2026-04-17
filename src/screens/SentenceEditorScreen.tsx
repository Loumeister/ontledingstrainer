import React, { useState, useEffect } from 'react';
import { EDITOR_SESSION_KEY } from '../components/LoginScreen';
import { Token, RoleKey, PredicateType, DifficultyLevel, RoleDefinition } from '../types';
import { ROLES } from '../constants';
import { DraggableRole } from '../components/WordChip';
import { detectWordOrder, detectWordOrderFromRoles, wordOrderBadgeClass, wordOrderTooltip } from '../logic/wordOrderLabel';
import {
  getCustomSentences,
  saveCustomSentence,
  deleteCustomSentence,
  exportCustomSentences,
  exportMergedLevel,
  getNextCustomId,
} from '../data/customSentenceStore';
import { loadAllSentences } from '../data/sentenceLoader';
import type { Sentence, TrainerAssignment } from '../types';
import LabEditorTab from '../components/LabEditorTab';
import {
  getAssignmentById,
  createAssignment as createTrainerAssignment,
  bumpVersion,
  computeContentHash,
} from '../services/trainerAssignmentStore';
import { getSubmissionsForAssignment } from '../services/trainerSubmissionStore';

type ListFilter = 'all' | 'builtin' | 'custom';

const PIN_SESSION_KEY = EDITOR_SESSION_KEY;

type EditorPhase = 'list' | 'input' | 'edit' | 'meta' | 'preview';
type EditorTab = 'zinnen' | 'zinsdeellab';

interface SentenceEditorScreenProps {
  onBack: () => void;
}

interface SentenceEditorContentProps {
  onBack?: () => void;
  onSentenceChange?: () => void;
  embedded?: boolean;
}

export const SentenceEditorContent: React.FC<SentenceEditorContentProps> = ({ onBack, onSentenceChange, embedded }) => {
  // Tab state
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>('zinnen');

  // Editor state
  const [phase, setPhase] = useState<EditorPhase>('list');
  const [sentenceText, setSentenceText] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [splitIndices, setSplitIndices] = useState<Set<number>>(new Set());
  const [chunkLabels, setChunkLabels] = useState<Record<string, RoleKey>>({});
  const [subLabels, setSubLabels] = useState<Record<string, RoleKey>>({});
  const [bijzinFunctieLabels, setBijzinFunctieLabels] = useState<Record<string, RoleKey>>({});
  const [bijvBepLinks, setBijvBepLinks] = useState<Record<string, number>>({});
  const [linkingBijvBepIdx, setLinkingBijvBepIdx] = useState<number | null>(null);
  const [predicateType, setPredicateType] = useState<PredicateType>('WG');
  const [level, setLevel] = useState<DifficultyLevel>(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState('');

  /**
   * Zinnenlab-annotaties (optioneel).
   * owNumber: getal van het OW (enkelvoud/meervoud) — voor congruentiecheck Zinnenlab
   * pvTense: werkwoordstijd PV (tt/vt) — voor tijdcheck Zinnenlab
   * null = "auto" (corpusGrouper bepaalt via heuristiek)
   */
  const [owNumber, setOwNumber] = useState<'sg' | 'pl' | null>(null);
  const [pvTense, setPvTense] = useState<'present' | 'past' | null>(null);

  // List state
  const [sentences, setSentences] = useState<Sentence[]>(getCustomSentences());
  const [builtInSentences, setBuiltInSentences] = useState<Sentence[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [levelFilter, setLevelFilter] = useState<DifficultyLevel | null>(null);

  // Assignment versioning
  const [currentAssignment, setCurrentAssignment] = useState<TrainerAssignment | null>(
    () => getAssignmentById('default'),
  );
  const refreshAssignment = () => setCurrentAssignment(getAssignmentById('default'));

  const refreshList = () => {
    setSentences(getCustomSentences());
    onSentenceChange?.();
  };

  useEffect(() => {
    loadAllSentences().then(setBuiltInSentences);
  }, []);

  const filteredSentences = (() => {
    let list: (Sentence & { _isBuiltIn?: boolean })[] = [];
    if (listFilter === 'all' || listFilter === 'custom') {
      list.push(...sentences.map(s => ({ ...s, _isBuiltIn: false })));
    }
    if (listFilter === 'all' || listFilter === 'builtin') {
      list.push(...builtInSentences.map(s => ({ ...s, _isBuiltIn: true })));
    }
    if (levelFilter !== null) {
      list = list.filter(s => s.level === levelFilter);
    }
    // Sort: custom first, then built-in, both by id
    list.sort((a, b) => {
      if (a._isBuiltIn !== b._isBuiltIn) return a._isBuiltIn ? 1 : -1;
      return a.id - b.id;
    });
    return list;
  })();

  const baseClass = embedded ? '' : 'min-h-screen bg-slate-50 dark:bg-slate-900';
  const pageClass = `${baseClass} p-2 md:p-4`;

  // --- Helper functions ---

  const resetEditor = () => {
    setSentenceText('');
    setWords([]);
    setSplitIndices(new Set());
    setChunkLabels({});
    setSubLabels({});
    setBijzinFunctieLabels({});
    setBijvBepLinks({});
    setLinkingBijvBepIdx(null);
    setPredicateType('WG');
    setLevel(1);
    setEditingId(null);
    setCustomLabel('');
    // Zinnenlab-annotaties resetten naar "auto" (null)
    setOwNumber(null);
    setPvTense(null);
  };

  const startNewSentence = () => {
    resetEditor();
    setPhase('input');
  };

  const processText = () => {
    const trimmed = sentenceText.trim();
    if (!trimmed) return;
    const w = trimmed.split(/\s+/);
    setWords(w);
    setSplitIndices(new Set());
    setChunkLabels({});
    setSubLabels({});
    setBijzinFunctieLabels({});
    setBijvBepLinks({});
    setLinkingBijvBepIdx(null);
    setPhase('edit');
  };

  // Build chunks from words + splits
  const getChunks = (): { words: string[]; indices: number[] }[] => {
    const chunks: { words: string[]; indices: number[] }[] = [];
    let current: { words: string[]; indices: number[] } = { words: [], indices: [] };
    words.forEach((w, i) => {
      current.words.push(w);
      current.indices.push(i);
      if (splitIndices.has(i) || i === words.length - 1) {
        chunks.push(current);
        current = { words: [], indices: [] };
      }
    });
    return chunks;
  };

  const getChunksFromSplits = (splits: Set<number>): { words: string[]; indices: number[] }[] => {
    const chunks: { words: string[]; indices: number[] }[] = [];
    let current: { words: string[]; indices: number[] } = { words: [], indices: [] };
    words.forEach((w, i) => {
      current.words.push(w);
      current.indices.push(i);
      if (splits.has(i) || i === words.length - 1) {
        chunks.push(current);
        current = { words: [], indices: [] };
      }
    });
    return chunks;
  };

  const toggleSplit = (idx: number) => {
    const oldChunks = getChunks();

    const next = new Set(splitIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSplitIndices(next);

    // Recompute chunks and remap labels
    const newChunks = getChunksFromSplits(next);
    const newLabels: Record<string, RoleKey> = {};
    const newBijzinFunctie: Record<string, RoleKey> = {};
    const newBijvBepLinks: Record<string, number> = {};
    newChunks.forEach((newChunk, newIdx) => {
      const firstWordIdx = newChunk.indices[0];
      const oldChunkIdx = oldChunks.findIndex(c => c.indices.includes(firstWordIdx));
      if (oldChunkIdx >= 0 && chunkLabels[oldChunkIdx]) {
        newLabels[newIdx] = chunkLabels[oldChunkIdx];
      }
      if (oldChunkIdx >= 0 && bijzinFunctieLabels[oldChunkIdx]) {
        newBijzinFunctie[newIdx] = bijzinFunctieLabels[oldChunkIdx];
      }
      if (oldChunkIdx >= 0 && bijvBepLinks[oldChunkIdx] !== undefined) {
        newBijvBepLinks[newIdx] = bijvBepLinks[oldChunkIdx];
      }
    });
    setChunkLabels(newLabels);
    setBijzinFunctieLabels(newBijzinFunctie);
    setBijvBepLinks(newBijvBepLinks);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, roleKey: string) => {
    e.dataTransfer.setData('text/role', roleKey);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropChunk = (e: React.DragEvent<HTMLDivElement>, chunkIdx: number) => {
    e.preventDefault();
    const roleKey = e.dataTransfer.getData('text/role') as RoleKey;
    if (roleKey) {
      setChunkLabels(prev => ({ ...prev, [chunkIdx]: roleKey }));
    }
  };

  const handleDropWord = (e: React.DragEvent<HTMLSpanElement>, wordIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const roleKey = e.dataTransfer.getData('text/role') as RoleKey;
    if (roleKey) {
      setSubLabels(prev => ({ ...prev, [`w${wordIdx}`]: roleKey }));
    }
  };

  const removeChunkLabel = (chunkIdx: number) => {
    const next = { ...chunkLabels };
    delete next[chunkIdx];
    setChunkLabels(next);
  };

  const removeSubLabel = (wordIdx: number) => {
    const next = { ...subLabels };
    delete next[`w${wordIdx}`];
    setSubLabels(next);
  };

  const handleDropBijzinFunctie = (e: React.DragEvent<HTMLDivElement>, chunkIdx: number) => {
    e.preventDefault();
    const roleKey = e.dataTransfer.getData('text/role') as RoleKey;
    if (roleKey) {
      setBijzinFunctieLabels(prev => ({ ...prev, [chunkIdx]: roleKey }));
    }
  };

  const removeBijzinFunctieLabel = (chunkIdx: number) => {
    const next = { ...bijzinFunctieLabels };
    delete next[chunkIdx];
    setBijzinFunctieLabels(next);
    // Also remove any bijvBepLink if the function is removed
    const nextLinks = { ...bijvBepLinks };
    delete nextLinks[chunkIdx];
    setBijvBepLinks(nextLinks);
  };

  const startBijvBepLinking = (chunkIdx: number) => {
    setLinkingBijvBepIdx(chunkIdx);
  };

  const completeBijvBepLink = (wordIdx: number) => {
    if (linkingBijvBepIdx === null) return;
    setBijvBepLinks(prev => ({ ...prev, [linkingBijvBepIdx]: wordIdx }));
    setLinkingBijvBepIdx(null);
  };

  const cancelBijvBepLinking = () => {
    setLinkingBijvBepIdx(null);
  };

  const removeBijvBepLink = (chunkIdx: number) => {
    const next = { ...bijvBepLinks };
    delete next[chunkIdx];
    setBijvBepLinks(next);
  };

  // Build sentence object from editor state
  const buildSentence = (): Sentence => {
    const chunks = getChunks();
    const id = editingId ?? getNextCustomId();
    const tokens: Token[] = [];
    let prevRole: RoleKey | null = null;

    chunks.forEach((chunk, chunkIdx) => {
      const role = chunkLabels[chunkIdx];
      const bijzinFunc = bijzinFunctieLabels[chunkIdx];
      chunk.indices.forEach((wordIdx, i) => {
        const token: Token = {
          id: `c${id}t${wordIdx + 1}`,
          text: words[wordIdx],
          role: role,
        };
        const sub = subLabels[`w${wordIdx}`];
        if (sub) token.subRole = sub;
        if (i === 0 && bijzinFunc && role === 'bijzin') token.bijzinFunctie = bijzinFunc;
        if (i === 0 && role === 'bijzin' && bijzinFunc === 'bijv_bep' && bijvBepLinks[chunkIdx] !== undefined) {
          token.bijvBepTarget = `c${id}t${bijvBepLinks[chunkIdx] + 1}`;
        }
        if (i === 0 && prevRole === role && chunkIdx > 0) {
          token.newChunk = true;
        }
        tokens.push(token);
        prevRole = role;
      });
    });

    const labelText = customLabel || `Zin ${id}: ${sentenceText.substring(0, 30)}${sentenceText.length > 30 ? '...' : ''}`;

    // Zinnenlab-annotaties: alleen meegeven als de docent ze expliciet heeft ingesteld.
    // null-waarden worden weggelaten zodat de corpusGrouper-heuristiek ze kan invullen.
    const sentence: Sentence = {
      id,
      label: labelText,
      predicateType,
      level,
      tokens,
    };
    if (owNumber !== null) sentence.owNumber = owNumber;
    if (pvTense !== null) sentence.pvTense = pvTense;

    return sentence;
  };

  // Validation
  const getValidationErrors = (): string[] => {
    const chunks = getChunks();
    const errors: string[] = [];

    if (chunks.length === 0) {
      errors.push('Geen zinsdelen gedefinieerd.');
      return errors;
    }

    const unlabeled = chunks.filter((_, i) => !chunkLabels[i]);
    if (unlabeled.length > 0) {
      errors.push(`${unlabeled.length} zinsdeel(en) zonder benaming.`);
    }

    const roles = Object.values(chunkLabels);
    if (!roles.includes('pv')) errors.push('Geen Persoonsvorm (PV) benoemd.');
    if (!roles.includes('ow')) errors.push('Geen Onderwerp (OW) benoemd.');

    if (predicateType === 'WG' && !roles.includes('wg')) {
      errors.push('Bij WG-zinnen: geen Werkwoordelijk Gezegde (WG) benoemd.');
    }
    if (predicateType === 'NG' && !roles.includes('nwd') && !roles.includes('ng')) {
      errors.push('Bij NG-zinnen: geen Naamwoordelijk Gezegde (NG) benoemd.');
    }

    // Bijzin function validation
    chunks.forEach((_, i) => {
      if (chunkLabels[i] === 'bijzin' && !bijzinFunctieLabels[i]) {
        errors.push('Bijzin zonder functie. Sleep een zinsdeel (bijv. LV, BWB) naar de functierij van de bijzin.');
      }
    });

    return errors;
  };

  const handleSave = () => {
    const sentence = buildSentence();
    saveCustomSentence(sentence);
    refreshList();
    setStatusMsg('Zin opgeslagen!');
    setTimeout(() => setStatusMsg(null), 2000);
    resetEditor();
    setPhase('list');
  };

  const handleEditSentence = (s: Sentence) => {
    setEditingId(s.id);
    const text = s.tokens.map(t => t.text).join(' ');
    setSentenceText(text);
    setWords(s.tokens.map(t => t.text));
    setPredicateType(s.predicateType);
    setLevel(s.level);
    setCustomLabel(s.label);
    // Zinnenlab-annotaties laden als aanwezig (anders null = auto)
    setOwNumber(s.owNumber ?? null);
    setPvTense(s.pvTense ?? null);

    // Reconstruct splits and labels from tokens
    const newSplits = new Set<number>();
    const newChunkLabels: Record<string, RoleKey> = {};
    const newSubLabels: Record<string, RoleKey> = {};
    const newBijzinFunctieLabels: Record<string, RoleKey> = {};
    const newBijvBepLinks: Record<string, number> = {};
    let chunkIdx = 0;
    newChunkLabels[0] = s.tokens[0].role;
    if (s.tokens[0].bijzinFunctie) newBijzinFunctieLabels[0] = s.tokens[0].bijzinFunctie;
    if (s.tokens[0].bijvBepTarget) {
      // Extract wordIdx from token ID pattern c{id}t{wordIdx+1}
      const match = s.tokens[0].bijvBepTarget.match(/t(\d+)$/);
      if (match) newBijvBepLinks[0] = parseInt(match[1], 10) - 1;
    }

    s.tokens.forEach((t, i) => {
      if (t.subRole) newSubLabels[`w${i}`] = t.subRole;
      if (i > 0) {
        const prevToken = s.tokens[i - 1];
        if (prevToken.role !== t.role || t.newChunk) {
          newSplits.add(i - 1);
          chunkIdx++;
          newChunkLabels[chunkIdx] = t.role;
          if (t.bijzinFunctie) newBijzinFunctieLabels[chunkIdx] = t.bijzinFunctie;
          if (t.bijvBepTarget) {
            const match = t.bijvBepTarget.match(/t(\d+)$/);
            if (match) newBijvBepLinks[chunkIdx] = parseInt(match[1], 10) - 1;
          }
        }
      }
    });

    setSplitIndices(newSplits);
    setChunkLabels(newChunkLabels);
    setSubLabels(newSubLabels);
    setBijzinFunctieLabels(newBijzinFunctieLabels);
    setBijvBepLinks(newBijvBepLinks);
    setPhase('edit');
  };

  /**
   * Opent een ingebouwde zin in de meta-fase voor annotatie (owNumber/pvTense).
   * Behoudt het originele ID zodat de opgeslagen versie de ingebouwde zin
   * overschrijft in het corpus (via de deduplicatie-fix in useTrainer).
   * De splits/labels worden gereconstrueerd maar de docent gaat direct naar meta
   * — er is geen reden om de splits opnieuw te tekenen.
   */
  const handleAnnotateBuiltIn = (s: Sentence) => {
    setEditingId(s.id);
    setSentenceText(s.tokens.map(t => t.text).join(' '));
    setWords(s.tokens.map(t => t.text));
    setPredicateType(s.predicateType);
    setLevel(s.level);
    setCustomLabel(s.label);
    setOwNumber(s.owNumber ?? null);
    setPvTense(s.pvTense ?? null);

    // Reconstrueer splits/labels zodat buildSentence() exact dezelfde tokens
    // teruggeeft als de originele ingebouwde zin (plus de nieuwe annotaties).
    const newSplits = new Set<number>();
    const newChunkLabels: Record<string, RoleKey> = {};
    const newSubLabels: Record<string, RoleKey> = {};
    const newBijzinFunctieLabels: Record<string, RoleKey> = {};
    const newBijvBepLinks: Record<string, number> = {};
    let chunkIdx = 0;
    newChunkLabels[0] = s.tokens[0].role;
    if (s.tokens[0].bijzinFunctie) newBijzinFunctieLabels[0] = s.tokens[0].bijzinFunctie;
    if (s.tokens[0].bijvBepTarget) {
      const match = s.tokens[0].bijvBepTarget.match(/t(\d+)$/);
      if (match) newBijvBepLinks[0] = parseInt(match[1], 10) - 1;
    }
    s.tokens.forEach((t, i) => {
      if (t.subRole) newSubLabels[`w${i}`] = t.subRole;
      if (i > 0) {
        const prevToken = s.tokens[i - 1];
        if (prevToken.role !== t.role || t.newChunk) {
          newSplits.add(i - 1);
          chunkIdx++;
          newChunkLabels[chunkIdx] = t.role;
          if (t.bijzinFunctie) newBijzinFunctieLabels[chunkIdx] = t.bijzinFunctie;
          if (t.bijvBepTarget) {
            const match = t.bijvBepTarget.match(/t(\d+)$/);
            if (match) newBijvBepLinks[chunkIdx] = parseInt(match[1], 10) - 1;
          }
        }
      }
    });
    setSplitIndices(newSplits);
    setChunkLabels(newChunkLabels);
    setSubLabels(newSubLabels);
    setBijzinFunctieLabels(newBijzinFunctieLabels);
    setBijvBepLinks(newBijvBepLinks);

    // Ga direct naar meta — splits/labels hoeven niet opnieuw ingesteld te worden
    setPhase('meta');
  };

  const handleDeleteSentence = (id: number) => {
    if (!confirm('Weet je zeker dat je deze zin wilt verwijderen?')) return;
    deleteCustomSentence(id);
    refreshList();
  };

  const handlePublishAssignment = () => {
    const customSentences = getCustomSentences();
    if (customSentences.length === 0) return;
    const sentenceIds = customSentences.map(s => s.id);
    const existing = getAssignmentById('default');
    if (!existing) {
      createTrainerAssignment('Aangepaste zinnen', sentenceIds, 'default');
      refreshAssignment();
      setStatusMsg('Opdracht gepubliceerd als versie 1.');
    } else {
      const newHash = computeContentHash(sentenceIds);
      if (newHash === existing.contentHash) {
        setStatusMsg('Geen wijzigingen — opdracht is al up-to-date.');
      } else {
        bumpVersion('default', sentenceIds);
        refreshAssignment();
        const newVersion = (existing.version + 1);
        setStatusMsg(`Nieuwe versie ${newVersion} gepubliceerd.`);
      }
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExport = () => {
    const json = exportCustomSentences();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docent-zinnen.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Exporteert het volledige corpus voor één niveau als kant-en-klaar
   * vervangingsbestand voor sentences-level-N.json.
   * Ingebouwde zinnen + custom overrides samengevoegd, gesorteerd op ID.
   */
  const handleExportLevel = (lvl: DifficultyLevel) => {
    const json = exportMergedLevel(lvl, builtInSentences, sentences);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentences-level-${lvl}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Render phases ---

  // LIST phase
  if (phase === 'list') {
    const builtInCount = builtInSentences.length;
    const customCount = sentences.length;

    return (
      <div className={pageClass}>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Zinnen-editor</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{builtInCount} ingebouwde + {customCount} eigen zinnen</p>
              </div>
              {onBack && <button onClick={onBack} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">Terug</button>}
            </div>

            {/* Top-level tab bar */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden mb-6 w-fit">
              {([['zinnen', 'Zinsontleding'], ['zinsdeellab', 'Zinsdeellab']] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveEditorTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeEditorTab === tab ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Zinsdeellab tab */}
            {activeEditorTab === 'zinsdeellab' && (
              <LabEditorTab />
            )}

            {/* Zinnen tab content below */}
            {activeEditorTab === 'zinnen' && (<>

            {statusMsg && (
              <div className="p-3 mb-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 text-sm font-medium border border-green-200 dark:border-green-800">{statusMsg}</div>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              <button onClick={startNewSentence} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Nieuwe zin</button>
              {sentences.length > 0 && (
                <button onClick={handleExport} className="px-4 py-2 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 font-medium rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">Exporteer eigen zinnen</button>
              )}
            </div>

            {/* Export volledig corpus per niveau — vervanging voor sentences-level-N.json */}
            {builtInSentences.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Exporteer corpus niveau:</span>
                {([0, 1, 2, 3, 4] as DifficultyLevel[]).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => handleExportLevel(lvl)}
                    className="px-3 py-1 text-xs font-medium rounded border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                  >
                    {lvl === 0 ? 'Instap' : `Niveau ${lvl}`}
                  </button>
                ))}
              </div>
            )}

            {/* Opdracht-versioning blok */}
            {sentences.length > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">Opdrachtstatus: </span>
                    {currentAssignment ? (
                      <>
                        versie {currentAssignment.version}
                        {' · '}
                        {(() => {
                          const count = getSubmissionsForAssignment('default', currentAssignment.version).length;
                          return count > 0 ? `${count} inzending${count !== 1 ? 'en' : ''}` : 'nog geen inzendingen';
                        })()}
                        {' · '}
                        <span className="text-slate-400">
                          {new Date(currentAssignment.updatedAt).toLocaleDateString('nl-NL')}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">nog niet gepubliceerd</span>
                    )}
                  </div>
                  <button
                    onClick={handlePublishAssignment}
                    className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {currentAssignment ? 'Nieuwe versie publiceren' : 'Publiceer als opdracht'}
                  </button>
                </div>
                {currentAssignment && (() => {
                  const newHash = computeContentHash(sentences.map(s => s.id));
                  if (newHash !== currentAssignment.contentHash) {
                    return (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        De zinnen zijn gewijzigd ten opzichte van de gepubliceerde versie. Publiceer een nieuwe versie om de wijzigingen vast te leggen.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                {([['all', 'Alle'], ['custom', 'Eigen'], ['builtin', 'Ingebouwd']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setListFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${listFilter === key ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                <button
                  onClick={() => setLevelFilter(null)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${levelFilter === null ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  Alle niveaus
                </button>
                {([0, 1, 2, 3, 4] as DifficultyLevel[]).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${levelFilter === lvl ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{filteredSentences.length} zinnen</p>

            {filteredSentences.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <p className="text-lg font-medium mb-1">Geen zinnen gevonden</p>
                <p className="text-sm">Pas de filters aan of maak een nieuwe zin.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredSentences.map(s => {
                  const isBuiltIn = (s as { _isBuiltIn?: boolean })._isBuiltIn;
                  return (
                    <div key={`${isBuiltIn ? 'b' : 'c'}-${s.id}`} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isBuiltIn ? 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-750' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{s.label}</p>
                          {isBuiltIn && (
                            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">ingebouwd</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Niveau {s.level} | {s.predicateType} | {s.tokens.length} woorden
                        </p>
                        {(() => {
                          const wo = detectWordOrder(s.tokens);
                          const badgeCls = wordOrderBadgeClass(wo.code);
                          return (
                            <div className="flex flex-wrap gap-1 mt-1 items-center">
                              <span
                                title={wordOrderTooltip(wo.code)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${badgeCls}`}
                              >
                                {wo.code}
                              </span>
                              {s.structuralTags?.map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex gap-2 ml-3">
                        {isBuiltIn ? (
                          <button onClick={() => handleAnnotateBuiltIn(s)} className="px-3 py-1 text-xs font-medium rounded border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">Kopieer & bewerk</button>
                        ) : (
                          <>
                            <button onClick={() => handleEditSentence(s)} className="px-3 py-1 text-xs font-medium rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Bewerk</button>
                            <button onClick={() => handleDeleteSentence(s.id)} className="px-3 py-1 text-xs font-medium rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Verwijder</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>)}
          </div>
        </div>
      </div>
    );
  }

  // INPUT phase
  if (phase === 'input') {
    return (
      <div className={`${pageClass} flex items-center justify-center`}>
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-2xl w-full space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {editingId ? 'Zin bewerken' : 'Nieuwe zin invoeren'}
            </h2>
            <button onClick={() => { resetEditor(); setPhase('list'); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Annuleer</button>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Type de zin</label>
            <textarea
              value={sentenceText}
              onChange={e => setSentenceText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-lg focus:border-blue-500 outline-none resize-none"
              rows={3}
              placeholder="Typ hier de zin..."
              autoFocus
            />
          </div>

          <button
            onClick={processText}
            disabled={!sentenceText.trim()}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zinsdeelproef & Benoemen
          </button>
        </div>
      </div>
    );
  }

  const chunks = getChunks();

  // EDIT phase — combined split + label
  if (phase === 'edit') {
    return (
      <div className={`${pageClass} pb-24`}>
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Zinsdeelproef & Benoemen</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Knip de zin in zinsdelen en sleep er labels op.</p>
            </div>
            <button onClick={() => setPhase('input')} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-3 py-1">Wijzig tekst</button>
          </div>

          {/* Role toolbar */}
          <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 sticky top-0 z-[100]">
            <div className="flex flex-col gap-2 md:gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Zinsdelen & Gezegde:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {ROLES.filter(r => !r.isSubOnly).map(role => (
                    <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} />
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sleep op specifieke woorden:</p>
                <div className="flex flex-wrap gap-2">
                  {ROLES.filter(r => r.isSubOnly).map(role => (
                    <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Linking mode banner */}
          {linkingBijvBepIdx !== null && (
            <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-700 rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                Klik op het woord waar deze bijzin bij hoort om de bijvoeglijke bepaling te koppelen.
              </p>
              <button
                onClick={cancelBijvBepLinking}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-teal-400 dark:border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
              >
                Annuleer
              </button>
            </div>
          )}

          {/* Chunks with split controls */}
          <div className="flex flex-wrap gap-y-6 gap-x-2 justify-center items-start pt-2 px-1">
            {chunks.map((chunk, chunkIdx) => {
              const assignedRoleKey = chunkLabels[chunkIdx];
              const roleDef = assignedRoleKey ? ROLES.find(r => r.key === assignedRoleKey) || null : null;
              const bijzinFunctieKey = bijzinFunctieLabels[chunkIdx];
              const bijzinFunctieDef = bijzinFunctieKey ? ROLES.find(r => r.key === bijzinFunctieKey) || null : null;
              const lastWordIdx = chunk.indices[chunk.indices.length - 1];
              const linkedWordIdx = bijvBepLinks[chunkIdx];
              const bijvBepTargetText = linkedWordIdx !== undefined ? words[linkedWordIdx] : undefined;

              return (
                <React.Fragment key={chunkIdx}>
                  <EditorChunk
                    chunk={chunk}
                    chunkIdx={chunkIdx}
                    roleDef={roleDef}
                    bijzinFunctieDef={bijzinFunctieDef}
                    subLabels={subLabels}
                    onDropChunk={handleDropChunk}
                    onDropBijzinFunctie={handleDropBijzinFunctie}
                    onDropWord={handleDropWord}
                    onRemoveChunkLabel={removeChunkLabel}
                    onRemoveBijzinFunctie={removeBijzinFunctieLabel}
                    onRemoveSubLabel={removeSubLabel}
                    onToggleSplit={toggleSplit}
                    bijvBepTargetText={bijvBepTargetText}
                    isLinkingMode={linkingBijvBepIdx !== null}
                    isLinkingSource={linkingBijvBepIdx === chunkIdx}
                    onStartBijvBepLinking={startBijvBepLinking}
                    onRemoveBijvBepLink={removeBijvBepLink}
                    onWordClick={completeBijvBepLink}
                  />

                  {/* Merge button between chunks */}
                  {chunkIdx < chunks.length - 1 && (
                    <div className="flex items-center self-center px-1">
                      <button
                        onClick={() => toggleSplit(lastWordIdx)}
                        className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-300 dark:text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 hover:border-blue-300 flex items-center justify-center transition-all shadow-sm"
                        title="Samenvoegen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Footer */}
          <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[500] p-3">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
              <button onClick={() => { resetEditor(); setPhase('list'); }} className="px-3 py-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg font-medium text-sm transition-colors">Annuleer</button>

              {/* Live woordvolgorde labelmaker */}
              {(() => {
                const orderedRoles = chunks.map((_, i) => chunkLabels[i] as RoleKey | undefined);
                const wo = detectWordOrderFromRoles(orderedRoles);
                const badgeCls = wordOrderBadgeClass(wo.code);
                return (
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <span>{chunks.length} zinsdeel{chunks.length !== 1 ? 'en' : ''}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Woordvolgorde:</span>
                    <span
                      title={wordOrderTooltip(wo.code)}
                      className={`px-2 py-0.5 rounded border font-mono font-bold text-[11px] ${badgeCls}`}
                    >
                      {wo.code}
                    </span>
                    {wo.components.length > 0 && (
                      <span className="text-slate-400 dark:text-slate-500">
                        ({wo.components.join(' – ')})
                      </span>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={() => setPhase('meta')}
                disabled={Object.keys(chunkLabels).length < chunks.length}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Verder →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // META phase
  if (phase === 'meta') {
    return (
      <div className={`${pageClass} flex items-center justify-center`}>
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-lg w-full space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Eigenschappen</h2>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Label (naam van de zin)</label>
            <input
              type="text"
              value={customLabel || `Zin ${editingId ?? getNextCustomId()}: ${sentenceText.substring(0, 30)}${sentenceText.length > 30 ? '...' : ''}`}
              onChange={e => setCustomLabel(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Soort gezegde</label>
            <div className="flex gap-3">
              <button onClick={() => setPredicateType('WG')} className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${predicateType === 'WG' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Werkwoordelijk (WG)</button>
              <button onClick={() => setPredicateType('NG')} className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${predicateType === 'NG' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Naamwoordelijk (NG)</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Moeilijkheidsgraad</label>
            <div className="flex gap-2">
              {([0, 1, 2, 3, 4] as DifficultyLevel[]).map(lvl => (
                <button key={lvl} onClick={() => setLevel(lvl)} className={`flex-1 py-2 text-sm font-bold rounded-lg border-2 transition-all ${level === lvl ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  {lvl === 0 ? 'Instap' : lvl === 1 ? 'Basis' : lvl === 2 ? 'Middel' : lvl === 3 ? 'Hoog' : 'Samengesteld'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Zinnenlab-annotaties (optioneel) ──────────────────────────────
              Deze velden worden gebruikt door het Zinnenlab (route #/zinnenlab)
              om congruentie (OW↔PV) en tijdconsistentie (PV↔BWB) te controleren.
              "Automatisch" = de corpusGrouper heuristiek bepaalt de waarde.
              Stel alleen in als de heuristiek waarschijnlijk fout zit. */}
          <details className="rounded-lg border border-slate-200 dark:border-slate-600">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-300 select-none hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Zinnenlab-annotaties (optioneel) ↓
            </summary>
            <div className="px-4 pb-4 pt-2 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Laat op "Automatisch" staan tenzij de heuristiek een fout maakt.
              </p>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Onderwerp getal (OW)
                </label>
                <div className="flex gap-2">
                  {([null, 'sg', 'pl'] as const).map(v => (
                    <button
                      key={String(v)}
                      onClick={() => setOwNumber(v)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all ${owNumber === v ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      {v === null ? 'Automatisch' : v === 'sg' ? 'Enkelvoud' : 'Meervoud'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Persoonsvorm tijd (PV)
                </label>
                <div className="flex gap-2">
                  {([null, 'present', 'past'] as const).map(v => (
                    <button
                      key={String(v)}
                      onClick={() => setPvTense(v)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all ${pvTense === v ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      {v === null ? 'Automatisch' : v === 'present' ? 'Tegenw. tijd' : 'Verleden tijd'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          <div className="flex gap-3">
            <button onClick={() => setPhase('edit')} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">← Terug</button>
            <button onClick={() => setPhase('preview')} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">Voorbeeld bekijken</button>
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW phase
  if (phase === 'preview') {
    const errors = getValidationErrors();
    const sentence = buildSentence();

    return (
      <div className={`${pageClass} flex items-center justify-center`}>
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-2xl w-full space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Voorbeeld</h2>

          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-2">
            <p className="font-bold text-slate-800 dark:text-white">{sentence.label}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{sentence.predicateType} | Niveau {sentence.level} | {sentence.tokens.length} woorden</p>
          </div>

          {/* Token preview */}
          <div className="flex flex-wrap gap-1">
            {sentence.tokens.map((t, i) => {
              const rd = ROLES.find(r => r.key === t.role);
              return (
                <span key={i} className={`px-2 py-1 rounded text-xs font-medium border ${rd?.colorClass || ''} ${rd?.borderColorClass || ''}`}>
                  {t.text}
                  <span className="opacity-60 ml-1">{rd?.shortLabel}</span>
                  {t.subRole && <span className="opacity-50 ml-0.5">({ROLES.find(r => r.key === t.subRole)?.shortLabel})</span>}
                  {t.bijzinFunctie && <span className="opacity-50 ml-0.5">[fn:{ROLES.find(r => r.key === t.bijzinFunctie)?.shortLabel}]</span>}
                  {t.bijvBepTarget && <span className="opacity-50 ml-0.5">[→{t.bijvBepTarget}]</span>}
                  {t.newChunk && <span className="opacity-50 ml-0.5">[NC]</span>}
                </span>
              );
            })}
          </div>

          {errors.length > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg">
              <p className="font-bold text-orange-800 dark:text-orange-200 text-sm mb-1">Waarschuwingen:</p>
              <ul className="text-sm text-orange-700 dark:text-orange-300 list-disc list-inside">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setPhase('meta')} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">← Terug</button>
            <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors">
              {editingId ? 'Bijwerken' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ─── Standalone screen with PIN auth (for #/editor route) ───────────────────

export const SentenceEditorScreen: React.FC<SentenceEditorScreenProps> = ({ onBack }) => {
  const [authenticated] = useState(() => sessionStorage.getItem(PIN_SESSION_KEY) === 'true');

  useEffect(() => {
    if (!authenticated) {
      window.location.hash = '#/login';
    }
  }, [authenticated]);

  if (!authenticated) return null;

  return <SentenceEditorContent onBack={onBack} />;
};

// --- EditorChunk sub-component ---

interface EditorChunkProps {
  chunk: { words: string[]; indices: number[] };
  chunkIdx: number;
  roleDef: RoleDefinition | null;
  bijzinFunctieDef: RoleDefinition | null;
  subLabels: Record<string, RoleKey>;
  onDropChunk: (e: React.DragEvent<HTMLDivElement>, chunkIdx: number) => void;
  onDropBijzinFunctie: (e: React.DragEvent<HTMLDivElement>, chunkIdx: number) => void;
  onDropWord: (e: React.DragEvent<HTMLSpanElement>, wordIdx: number) => void;
  onRemoveChunkLabel: (chunkIdx: number) => void;
  onRemoveBijzinFunctie: (chunkIdx: number) => void;
  onRemoveSubLabel: (wordIdx: number) => void;
  onToggleSplit: (wordIdx: number) => void;
  bijvBepTargetText?: string;
  isLinkingMode: boolean;
  isLinkingSource: boolean;
  onStartBijvBepLinking: (chunkIdx: number) => void;
  onRemoveBijvBepLink: (chunkIdx: number) => void;
  onWordClick: (wordIdx: number) => void;
}

const EditorChunk: React.FC<EditorChunkProps> = ({
  chunk, chunkIdx, roleDef, bijzinFunctieDef, subLabels,
  onDropChunk, onDropBijzinFunctie, onDropWord, onRemoveChunkLabel, onRemoveBijzinFunctie, onRemoveSubLabel, onToggleSplit,
  bijvBepTargetText, isLinkingMode, isLinkingSource, onStartBijvBepLinking, onRemoveBijvBepLink, onWordClick,
}) => {
  const [isOver, setIsOver] = useState(false);
  const [isOverBijzinFunctie, setIsOverBijzinFunctie] = useState(false);
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);
  const showBijzinFunctieRow = roleDef?.key === 'bijzin';

  let borderColor = 'border-slate-300 dark:border-slate-600';
  let bgColor = 'bg-white dark:bg-slate-800';

  if (isOver) {
    borderColor = 'border-blue-400 dark:border-blue-500';
    bgColor = 'bg-blue-50 dark:bg-blue-900/20';
  } else if (roleDef) {
    borderColor = roleDef.borderColorClass;
  }

  return (
    <div
      className={`relative flex flex-col min-w-[140px] rounded-xl border-2 transition-colors duration-200 ${borderColor} ${bgColor}`}
      onDragOver={e => { e.preventDefault(); if (hoveredWord === null) setIsOver(true); }}
      onDrop={e => { if (hoveredWord !== null) return; setIsOver(false); onDropChunk(e, chunkIdx); }}
      onDragLeave={() => setIsOver(false)}
    >
      {/* Role header */}
      <div
        className={`h-9 border-b border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs rounded-t-lg cursor-pointer transition-opacity ${roleDef ? roleDef.colorClass + ' font-bold hover:opacity-80' : 'text-slate-400 dark:text-slate-500 italic'}`}
        onClick={() => roleDef && onRemoveChunkLabel(chunkIdx)}
      >
        {roleDef ? (
          <div className="flex items-center gap-2 w-full justify-center px-2 relative group/header">
            <span>{roleDef.label}</span>
            <button onClick={e => { e.stopPropagation(); onRemoveChunkLabel(chunkIdx); }} className="hidden group-hover/header:flex absolute right-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full w-5 h-5 items-center justify-center transition-colors">×</button>
          </div>
        ) : (
          'Sleep zinsdeel hier'
        )}
      </div>

      {/* Bijzin Function Row */}
      {showBijzinFunctieRow && (
        <div
          className={`h-8 border-b border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center text-[11px] cursor-pointer transition-all ${isOverBijzinFunctie ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' : ''} ${bijzinFunctieDef ? bijzinFunctieDef.colorClass + ' font-bold hover:opacity-80' : 'text-slate-400 dark:text-slate-500 italic'}`}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsOverBijzinFunctie(true); setIsOver(false); }}
          onDragLeave={() => setIsOverBijzinFunctie(false)}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); setIsOverBijzinFunctie(false); onDropBijzinFunctie(e, chunkIdx); }}
          onClick={() => bijzinFunctieDef && onRemoveBijzinFunctie(chunkIdx)}
        >
          {bijzinFunctieDef ? (
            <div className="flex items-center gap-2 w-full justify-center px-2 relative group/functie">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1">functie:</span>
              <span>{bijzinFunctieDef.label}</span>
              <button onClick={e => { e.stopPropagation(); onRemoveBijzinFunctie(chunkIdx); }} className="hidden group-hover/functie:flex absolute right-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full w-4 h-4 items-center justify-center transition-colors text-[10px]">×</button>
            </div>
          ) : (
            <span className="text-[10px]">Sleep functie hier (bijv. LV, BWB)</span>
          )}
        </div>
      )}

      {/* BijvBep Link Row */}
      {showBijzinFunctieRow && bijzinFunctieDef?.key === 'bijv_bep' && (
        <div className="h-8 border-b border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center text-[11px] px-2">
          {bijvBepTargetText ? (
            <div className="flex items-center gap-1 group/bvblink">
              <span className="text-teal-600 dark:text-teal-400">hoort bij: '{bijvBepTargetText}'</span>
              <button
                onClick={() => onRemoveBijvBepLink(chunkIdx)}
                className="hidden group-hover/bvblink:inline-flex hover:bg-black/10 dark:hover:bg-white/10 rounded-full w-4 h-4 items-center justify-center transition-colors text-[10px] text-red-500"
              >×</button>
            </div>
          ) : isLinkingSource ? (
            <span className="text-teal-600 dark:text-teal-400 animate-pulse">← Klik op het woord waar deze bijzin bij hoort</span>
          ) : (
            <button
              onClick={() => onStartBijvBepLinking(chunkIdx)}
              className="text-teal-500 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              Wijs het woord aan waar deze bijzin bij hoort →
            </button>
          )}
        </div>
      )}

      {/* Words with inline splitters */}
      <div className="p-3 flex flex-wrap gap-y-4 gap-x-0 justify-center items-end min-h-[60px] text-lg leading-tight">
        {chunk.words.map((word, i) => {
          const wordIdx = chunk.indices[i];
          const subKey = `w${wordIdx}`;
          const subRole = subLabels[subKey] ? ROLES.find(r => r.key === subLabels[subKey]) : null;
          const isHovered = hoveredWord === wordIdx;
          const isClickableTarget = isLinkingMode && !isLinkingSource;

          return (
            <React.Fragment key={wordIdx}>
              <div className="relative flex flex-col items-center group/word">
                {subRole && (
                  <div
                    className={`absolute -top-6 text-[9px] px-1.5 py-0.5 rounded-md border shadow-sm whitespace-nowrap z-10 cursor-pointer ${subRole.colorClass} ${subRole.borderColorClass}`}
                    onClick={() => onRemoveSubLabel(wordIdx)}
                    title="Klik om te verwijderen"
                  >
                    {subRole.shortLabel}
                  </div>
                )}
                <span
                  className={`text-slate-800 dark:text-slate-200 font-medium px-1 py-1 rounded transition-colors duration-200 border border-transparent ${isHovered ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-600 shadow-sm' : ''} ${!isHovered && !subRole && !isClickableTarget ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''} ${isClickableTarget ? 'cursor-pointer ring-2 ring-teal-400 dark:ring-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:ring-teal-500' : ''}`}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setHoveredWord(wordIdx); setIsOver(false); }}
                  onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setHoveredWord(null); }}
                  onDrop={e => {
                    e.preventDefault(); e.stopPropagation();
                    onDropWord(e, wordIdx);
                    setHoveredWord(null);
                  }}
                  onClick={isClickableTarget ? () => onWordClick(wordIdx) : undefined}
                >
                  {word}
                </span>
              </div>

              {/* Splitter between words within this chunk */}
              {i < chunk.words.length - 1 && (
                <div
                  className="w-4 h-8 flex items-center justify-center cursor-pointer group/splitter mx-[-2px] z-10 hover:w-6 transition-all"
                  onClick={e => { e.stopPropagation(); onToggleSplit(wordIdx); }}
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
    </div>
  );
};
