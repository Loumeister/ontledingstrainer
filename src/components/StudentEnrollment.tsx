import { useEffect, useRef, useState } from 'react';
import { ApiError, enrollStudent, getStudentSession, type StudentSession } from '../services/secureApi';

export function StudentEnrollment({ onDone }: { onDone: (student: StudentSession | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => { if (error && !busy) input.current?.focus(); }, [error, busy]);
  return <form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await enrollStudent(code.trim());
      setCode('');
      onDone(await getStudentSession());
    } catch (error) {
      setError(error instanceof ApiError && error.status === 401
        ? 'Deze code is onjuist, verlopen of al gebruikt. Vraag je docent om een nieuwe code.'
        : error instanceof Error ? error.message : 'Aanmelden niet beschikbaar.');
    }
    finally { setBusy(false); }
  }} className="space-y-4">
    <h2 id="student-enrollment-title" className="text-lg font-bold text-slate-800 dark:text-white">Oefenen voor je docent</h2>
    <p className="text-sm text-slate-500 dark:text-slate-400">Gebruik de persoonlijke code van je docent. Je blijft op deze browser maximaal 30 dagen aangemeld; je ingestuurde werk blijft bij hetzelfde leerlingrecord.</p>
      <label htmlFor="student-code" className="block text-sm text-slate-700 dark:text-slate-200">Eenmalige leerlingcode</label>
      <input ref={input} id="student-code" name="student-code" autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} disabled={busy} value={code} onChange={event => setCode(event.target.value)} maxLength={43} required aria-describedby={error ? 'student-code-help student-code-error' : 'student-code-help'} aria-invalid={!!error} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500" />
      <p id="student-code-help" className="text-xs text-slate-500 dark:text-slate-400">Deze code is 24 uur geldig en werkt één keer. Bij een verlopen aanmelding vraag je je docent om een nieuwe code.</p>
    {error && <p id="student-code-error" role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
    <button disabled={busy} className="w-full p-3 rounded-lg bg-blue-600 text-white font-bold disabled:opacity-50">{busy ? 'Aanmelden…' : 'Aanmelden en oefenen'}</button>
    <button type="button" disabled={busy} onClick={() => onDone(null)} className="w-full p-3 rounded-lg border text-slate-700 dark:text-slate-200">Vrij oefenen op dit apparaat</button>
    <p className="text-xs text-slate-500 dark:text-slate-400">Vrij oefenen bewaart resultaten lokaal. Met een nieuwe code voor jouw bestaande leerlingrecord vind je je ingestuurde werk ook op een andere laptop.</p>
  </form>;
}

export function StudentAccessDialog({ onDone, onCancel }: {
  onDone: (student: StudentSession | null) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby="student-enrollment-title" onCancel={onCancel}
    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-sm w-full backdrop:bg-black/50">
    <StudentEnrollment onDone={onDone} />
    <button type="button" onClick={onCancel} className="mt-4 w-full p-2 underline text-slate-700 dark:text-slate-200">Annuleren</button>
  </dialog>;
}
