import { useEffect, useState } from 'react';
import { fetchReportPages } from '../services/googleDriveSync';
import { decodeReport, type SessionReport } from '../services/sessionReport';

/** Server chooses the pupil from its HttpOnly session; no identity parameter. */
export function StudentServerHistory() {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [message, setMessage] = useState('Ingestuurd werk laden…');
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    void fetchReportPages('/student/reports').then(rows => {
      if (!active) return;
      setReports(rows.flatMap(row => { const r = decodeReport(row.code); return r ? [r] : []; }));
      setMessage(rows.length ? '' : 'Nog geen werk ingestuurd met je leerlinglogin.');
    }).catch(() => { if (active) setMessage('Meld je met je eenmalige leerlingcode aan om je ingestuurde werk te bekijken.'); });
    return () => { active = false; };
  }, []);
  return <section className="p-4 border rounded-xl text-slate-800 dark:text-slate-200 space-y-3 mb-6">
    <h2 className="font-bold">Ingestuurd werk voor je docent</h2>
    <p className="text-sm">Deze rapporten blijven bewaard bij een laptopwissel.</p>
    <p role="status" className="text-sm">{message}</p>
    {reports.length > 0 && <ul className="divide-y divide-slate-200 dark:divide-slate-700">
      {[...reports].reverse().slice(page * 50, (page + 1) * 50).map((r, index) => <li key={`${page}-${index}`} className="py-2 text-sm flex justify-between gap-3"><time dateTime={r.ts}>{new Date(r.ts).toLocaleString('nl-NL')}</time><span>{r.c}/{r.t} zinsdelen goed</span></li>)}
    </ul>}
    {reports.length > 50 && <nav aria-label="Pagina's ingestuurd werk" className="flex gap-3 text-sm">
      <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 border rounded-lg disabled:opacity-50">Vorige</button>
      <span>Pagina {page + 1} van {Math.ceil(reports.length / 50)}</span>
      <button type="button" disabled={(page + 1) * 50 >= reports.length} onClick={() => setPage(p => p + 1)} className="p-2 border rounded-lg disabled:opacity-50">Volgende</button>
    </nav>}
  </section>;
}
