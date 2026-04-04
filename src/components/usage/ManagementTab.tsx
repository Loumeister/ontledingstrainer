/**
 * ManagementTab — "Beheer" tab in usage analytics.
 *
 * Merge/rename classes and students with undo, import reports, export/clear data.
 */
import React, { useState } from 'react';
import type { SessionReport } from '../../services/sessionReport';
import { computeAggregateStats, decodeReport, addReport, clearReports, renameKlas, renameStudent } from '../../services/sessionReport';
import { loadUsageData, clearUsageData, exportUsageDataAsJson } from '../../services/usageData';
import { setKlasAlias, setStudentAlias } from '../../services/nameAliases';
import { getScriptUrl, renameKlasOnDrive, renameStudentOnDrive } from '../../services/googleDriveSync';
import { getMergeHistory, addMergeAction, undoMergeAction } from '../../services/mergeHistory';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ManagementTabProps {
  allReports: SessionReport[];
  onReportsChanged: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ManagementTab: React.FC<ManagementTabProps> = ({ allReports, onReportsChanged }) => {
  // Klas rename
  const [editingKlas, setEditingKlas] = useState<string | null>(null);
  const [editingKlasValue, setEditingKlasValue] = useState('');

  // Klas merge
  const [mergingKlas, setMergingKlas] = useState<string | null>(null);
  const [mergeTargetKlas, setMergeTargetKlas] = useState('');
  const [mergeStatus, setMergeStatus] = useState<'idle' | 'merging' | 'success' | 'error'>('idle');
  const [mergeError, setMergeError] = useState('');

  // Student rename
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editingStudentValue, setEditingStudentValue] = useState('');
  const [studentRenameStatus, setStudentRenameStatus] = useState<'idle' | 'renaming' | 'success' | 'error'>('idle');
  const [studentRenameError, setStudentRenameError] = useState('');

  // Manual import
  const [reportInput, setReportInput] = useState('');
  const [reportMsg, setReportMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Merge history
  const [mergeHistory, setMergeHistory] = useState(() => getMergeHistory());

  const aggregateStats = computeAggregateStats(allReports);

  // --- Handlers ---

  const handleRenameKlas = (oldKlas: string) => {
    const newKlas = editingKlasValue.trim().toLowerCase();
    if (newKlas && newKlas !== oldKlas) {
      renameKlas(oldKlas, newKlas);
      setKlasAlias(oldKlas, newKlas);
      addMergeAction({ type: 'rename_klas', oldValue: oldKlas, newValue: newKlas });
      setMergeHistory(getMergeHistory());
      onReportsChanged();
      if (getScriptUrl()) {
        renameKlasOnDrive(oldKlas, newKlas).catch(() => {});
      }
    }
    setEditingKlas(null);
    setEditingKlasValue('');
  };

  const handleMergeKlas = async (sourceKlas: string) => {
    const target = mergeTargetKlas.trim().toLowerCase();
    if (!target || target === sourceKlas) return;
    if (!confirm(`Klas "${sourceKlas}" samenvoegen met "${target}"? Alle rapporten van ${sourceKlas} worden overgezet naar ${target}. Dit kan ongedaan worden via het actieoverzicht hieronder.`)) return;
    setMergeStatus('merging');
    setMergeError('');
    try {
      renameKlas(sourceKlas, target);
      setKlasAlias(sourceKlas, target);
      addMergeAction({ type: 'merge_klas', oldValue: sourceKlas, newValue: target });
      setMergeHistory(getMergeHistory());
      onReportsChanged();
      if (getScriptUrl()) {
        await renameKlasOnDrive(sourceKlas, target);
      }
      setMergeStatus('success');
      setMergingKlas(null);
      setMergeTargetKlas('');
      setTimeout(() => setMergeStatus('idle'), 2000);
    } catch (err) {
      setMergeStatus('error');
      setMergeError(err instanceof Error ? err.message : 'Fout bij samenvoegen');
    }
  };

  const handleRenameStudent = async (oldName: string) => {
    const newName = editingStudentValue.trim();
    if (!newName || newName.toLowerCase() === oldName.toLowerCase()) {
      setEditingStudent(null);
      setEditingStudentValue('');
      return;
    }
    setStudentRenameStatus('renaming');
    setStudentRenameError('');
    try {
      renameStudent(oldName, newName);
      setStudentAlias(oldName, newName);
      addMergeAction({ type: 'rename_student', oldValue: oldName, newValue: newName });
      setMergeHistory(getMergeHistory());
      onReportsChanged();
      if (getScriptUrl()) {
        await renameStudentOnDrive(oldName, newName);
      }
      setStudentRenameStatus('success');
      setEditingStudent(null);
      setEditingStudentValue('');
      setTimeout(() => setStudentRenameStatus('idle'), 2000);
    } catch (err) {
      setStudentRenameStatus('error');
      setStudentRenameError(err instanceof Error ? err.message : 'Fout bij hernoemen');
    }
  };

  const handleImportReport = () => {
    const decoded = decodeReport(reportInput);
    if (!decoded) {
      setReportMsg({ text: 'Ongeldige rapportcode. Vraag de leerling om een nieuwe code te genereren.', ok: false });
      return;
    }
    addReport(decoded);
    const name = decoded.name || 'Anoniem';
    setReportMsg({ text: `Rapport van ${name} toegevoegd (${decoded.c}/${decoded.t} goed)`, ok: true });
    setReportInput('');
    onReportsChanged();
  };

  const handleUndo = (id: string) => {
    undoMergeAction(id);
    setMergeHistory(getMergeHistory());
    onReportsChanged();
  };

  const handleClearReports = () => {
    if (confirm('Alle leerlingrapporten wissen? Dit kan niet ongedaan worden.')) {
      clearReports();
      onReportsChanged();
    }
  };

  const handleClearData = () => {
    if (confirm('Alle gebruiksdata wissen? Dit kan niet ongedaan worden.')) {
      clearUsageData();
      onReportsChanged();
    }
  };

  return (
    <div className="space-y-6">

      {/* Klas hernoemen / samenvoegen */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Klassen beheren</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Hernoem of voeg klassen samen. Wijzigingen worden ook doorgevoerd in het Google Sheet (als gekoppeld).</p>

        {aggregateStats.klasStats.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Nog geen klassen gevonden in de rapporten.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-1 pr-3 font-medium">Klas</th>
                  <th className="pb-1 pr-3 font-medium text-center">Rapporten</th>
                  <th className="pb-1 pr-3 font-medium text-center">Leerlingen</th>
                  <th className="pb-1 font-medium">Acties</th>
                </tr>
              </thead>
              <tbody>
                {aggregateStats.klasStats.map(ks => (
                  <React.Fragment key={ks.klas}>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                      <td className="py-1.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                        {editingKlas === ks.klas ? (
                          <span className="flex items-center gap-1">
                            <input type="text" value={editingKlasValue}
                              onChange={e => setEditingKlasValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameKlas(ks.klas); if (e.key === 'Escape') setEditingKlas(null); }}
                              className="w-20 px-1 py-0.5 text-xs rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none"
                              autoFocus />
                            <button onClick={() => handleRenameKlas(ks.klas)} className="text-emerald-600 hover:text-emerald-700 text-xs" title="Opslaan">✓</button>
                            <button onClick={() => setEditingKlas(null)} className="text-slate-400 hover:text-slate-600 text-xs" title="Annuleren">✕</button>
                          </span>
                        ) : ks.klas}
                      </td>
                      <td className="py-1.5 pr-3 text-center text-slate-500">{ks.reportCount}</td>
                      <td className="py-1.5 pr-3 text-center text-slate-500">{ks.uniqueStudents}</td>
                      <td className="py-1.5">
                        <div className="flex gap-1">
                          {editingKlas !== ks.klas && (
                            <button onClick={() => { setEditingKlas(ks.klas); setEditingKlasValue(ks.klas); setMergingKlas(null); }}
                              className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                              title="Hernoemen">Hernoemen</button>
                          )}
                          {aggregateStats.klasStats.length > 1 && (
                            <button onClick={() => { setMergingKlas(mergingKlas === ks.klas ? null : ks.klas); setMergeTargetKlas(''); setMergeStatus('idle'); setEditingKlas(null); }}
                              className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100 transition-colors"
                              title="Samenvoegen">Samenvoegen</button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {mergingKlas === ks.klas && (
                      <tr className="bg-orange-50 dark:bg-orange-900/10">
                        <td colSpan={4} className="py-2 px-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-orange-700 dark:text-orange-300 font-medium">Samenvoegen met:</span>
                            <select value={mergeTargetKlas} onChange={e => setMergeTargetKlas(e.target.value)}
                              className="px-2 py-1 rounded border border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs">
                              <option value="">— kies klas —</option>
                              {aggregateStats.klasStats.filter(k => k.klas !== ks.klas).map(k => <option key={k.klas} value={k.klas}>{k.klas}</option>)}
                            </select>
                            <button onClick={() => handleMergeKlas(ks.klas)} disabled={!mergeTargetKlas || mergeStatus === 'merging'}
                              className="px-2 py-1 rounded bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {mergeStatus === 'merging' ? 'Bezig...' : 'Samenvoegen'}
                            </button>
                            <button onClick={() => { setMergingKlas(null); setMergeStatus('idle'); }}
                              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Annuleren</button>
                            {mergeStatus === 'success' && <span className="text-emerald-600 dark:text-emerald-400">Samengevoegd</span>}
                            {mergeStatus === 'error' && <span className="text-red-600 dark:text-red-400">{mergeError}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leerling hernoemen */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Leerlingen hernoemen</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Corrigeer spelfouten of voeg leerlingen samen.</p>

        {aggregateStats.studentNames.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Nog geen leerlingen gevonden in de rapporten.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {aggregateStats.studentNames.map(name => (
              <div key={name} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                {editingStudent === name.toLowerCase() ? (
                  <>
                    <input type="text" value={editingStudentValue}
                      onChange={e => setEditingStudentValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameStudent(name); if (e.key === 'Escape') setEditingStudent(null); }}
                      className="w-24 px-1 py-0.5 text-xs rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none"
                      autoFocus />
                    <button onClick={() => handleRenameStudent(name)} className="text-emerald-600 hover:text-emerald-700" disabled={studentRenameStatus === 'renaming'}>
                      {studentRenameStatus === 'renaming' ? '...' : '✓'}
                    </button>
                    <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                    {studentRenameStatus === 'error' && <span className="text-red-500 text-[10px]">{studentRenameError}</span>}
                  </>
                ) : (
                  <>
                    <span className="text-slate-700 dark:text-slate-200 capitalize">{name}</span>
                    <button onClick={() => { setEditingStudent(name.toLowerCase()); setEditingStudentValue(name); setStudentRenameStatus('idle'); }}
                      className="text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400"
                      title="Naam wijzigen">✎</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recente acties (merge/rename history with undo) */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Recente acties</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Overzicht van hernoemingen en samenvoegingen. Gebruik &quot;Ongedaan maken&quot; om een actie terug te draaien.</p>

        {mergeHistory.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Nog geen acties uitgevoerd.</p>
        ) : (
          <div className="space-y-2">
            {mergeHistory.slice().reverse().slice(0, 15).map(action => {
              const typeLabel = action.type === 'rename_klas' ? 'Klas hernoemen' : action.type === 'merge_klas' ? 'Klassen samenvoegen' : 'Leerling hernoemen';
              return (
                <div key={action.id} className={`flex items-center gap-3 text-xs p-2 rounded-lg border ${
                  action.undone
                    ? 'bg-slate-50 dark:bg-slate-700/20 border-slate-100 dark:border-slate-700 opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{typeLabel}:</span>
                    <span className={`ml-1 ${action.undone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {action.oldValue} → {action.newValue}
                    </span>
                    {action.undone && <span className="ml-1 text-slate-400">(ongedaan gemaakt)</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(action.timestamp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!action.undone && (
                    <button onClick={() => handleUndo(action.id)}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100 transition-colors font-medium shrink-0">
                      Ongedaan maken
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rapport importeren */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Rapport importeren</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Plak een rapportcode handmatig (reserve / offline)</p>
        <div className="space-y-2">
          <textarea value={reportInput}
            onChange={e => { setReportInput(e.target.value); setReportMsg(null); }}
            placeholder="Plak rapportcode hier (begint met v1:)..."
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 outline-none resize-none h-16" />
          <button onClick={handleImportReport} disabled={!reportInput.trim()}
            className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Importeer rapport
          </button>
          {reportMsg && (
            <p className={`text-xs font-medium ${reportMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {reportMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Download / Wis data */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Gegevens beheren</h3>
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => exportUsageDataAsJson(loadUsageData())}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            Download gegevens
          </button>
          <button onClick={handleClearReports}
            className="px-3 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-sm font-medium hover:bg-red-200 transition-colors">
            Wis leerlingrapporten
          </button>
          <button onClick={handleClearData}
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            Wis alle gebruiksdata
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagementTab;
