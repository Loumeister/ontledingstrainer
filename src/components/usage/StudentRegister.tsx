import { useEffect, useState } from 'react';
import { createStudent, getStudents, reissueStudentCode, updateStudent, type StudentSession } from '../../services/secureApi';

export function StudentRegister({ onChanged }: { onChanged: () => void }) {
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [klas, setKlas] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const refresh = async () => setStudents(await getStudents());
  useEffect(() => { void refresh().catch(() => setMessage('Leerlingregister niet beschikbaar.')); }, []);
  const issue = async (student: StudentSession) => {
    if (!confirm(`Nieuwe code voor ${student.name}? De huidige aanmelding op alle apparaten vervalt.`)) return;
    setBusy(true); setCode(''); setMessage('');
    try { const result = await reissueStudentCode(student.id); setCode(result.code); setMessage(`Nieuwe code voor ${student.name}.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Niet beschikbaar.'); }
    finally { setBusy(false); }
  };
  return <section className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Leerlingregister</h2>
    <p className="text-sm text-slate-500 dark:text-slate-400">Registreer je leerlingen eenmalig en deel de persoonlijke code. De code werkt één keer en is 24 uur geldig. Een nieuwe code voor hetzelfde record behoudt het leerling-ID en de historie.</p>
    <form className="grid gap-3 sm:grid-cols-3" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setCode(''); setMessage('');
      try {
        if (editing) {
          await updateStudent({ id: editing, name, initial, klas }); setMessage('Leerlinggegevens bijgewerkt.');
        } else { const result = await createStudent(name, initial, klas); setCode(result.code); setMessage(`Code voor ${name}.`); }
        setName(''); setInitial(''); setKlas(''); setEditing(null); await refresh(); onChanged();
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Niet beschikbaar.'); }
      finally { setBusy(false); }
    }}>
      <label className="text-sm text-slate-700 dark:text-slate-200">Naam<input name="student-name" autoComplete="off" value={name} onChange={event => setName(event.target.value)} required maxLength={80} className="block w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500" /></label>
      <label className="text-sm text-slate-700 dark:text-slate-200">Initiaal (optioneel)<input name="student-initial" autoComplete="off" value={initial} onChange={event => setInitial(event.target.value)} maxLength={1} className="block w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500" /></label>
      <label className="text-sm text-slate-700 dark:text-slate-200">Klas<input name="student-class" autoComplete="off" value={klas} onChange={event => setKlas(event.target.value)} required maxLength={32} className="block w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500" /></label>
      <button disabled={busy} className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">{editing ? 'Leerling opslaan' : 'Leerling toevoegen'}</button>
      {editing && <button type="button" onClick={() => { setEditing(null); setName(''); setInitial(''); setKlas(''); }} className="p-2 border rounded-lg text-slate-700 dark:text-slate-200">Annuleren</button>}
    </form>
    <p role="status" className="text-sm text-slate-700 dark:text-slate-200">{message}</p>
    {code && <div className="p-3 border rounded-lg space-y-2 text-slate-800 dark:text-white">
      <p className="text-sm">Deel deze code alleen met de betreffende leerling. De code is 24 uur geldig en één keer bruikbaar.</p>
      <code className="block break-all select-all">{code}</code>
      <button type="button" onClick={() => setCode('')} className="underline">Code verbergen</button>
    </div>}
    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
      {students.slice(page * 50, (page + 1) * 50).map(student => <li key={student.id} className="flex flex-wrap items-center gap-3 py-3 text-sm text-slate-700 dark:text-slate-200">
        <span className="flex-1 min-w-0 break-words">{student.name} {student.initial} · {student.klas} <span className="block text-xs text-slate-500">ID: {student.id}</span></span>
        <button type="button" disabled={busy} onClick={() => { setEditing(student.id); setName(student.name); setInitial(student.initial); setKlas(student.klas); setCode(''); }} className="p-2 border rounded-lg">Bewerken<span className="sr-only"> {student.name}</span></button>
        <button type="button" disabled={busy} onClick={() => void issue(student)} className="p-2 border rounded-lg">Nieuwe code<span className="sr-only"> voor {student.name}</span></button>
      </li>)}
    </ul>
    {students.length > 50 && <nav aria-label="Pagina's leerlingregister" className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
      <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 border rounded-lg disabled:opacity-50">Vorige</button>
      <span>Pagina {page + 1} van {Math.ceil(students.length / 50)}</span>
      <button type="button" disabled={(page + 1) * 50 >= students.length} onClick={() => setPage(p => p + 1)} className="p-2 border rounded-lg disabled:opacity-50">Volgende</button>
    </nav>}
  </section>;
}
