import { useEffect, useState, type ReactNode } from 'react';
import { getAccountSession, type AccountRole, type AccountSession } from '../services/secureApi';

/** UX gate only: API independently authorizes every request. */
export function RequireAccount({ roles, children }: { roles: AccountRole[]; children: (user: AccountSession) => ReactNode }) {
  const [user, setUser] = useState<AccountSession | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const check = () => getAccountSession().then(value => { if (alive) { setUser(value); setError(''); } }).catch(() => { if (alive) { setUser(null); setError('Meld je aan met een toegestaan Google-account.'); } });
    void check();
    const timer = setInterval(check, 60000);
    window.addEventListener('focus', check);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', check); };
  }, []);
  if (user && roles.includes(user.role)) return children(user);
  return <main className="min-h-screen p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">
    <h1 className="text-xl font-bold">Aanmelden</h1>
    <p role="status" className="my-4">{user ? 'Je account heeft geen toegang tot deze functie.' : error || 'Aanmelding controleren…'}</p>
    <a href="#/login" className="text-blue-600 underline">Aanmelden met Google</a>
    <a href="#/" className="ml-4 underline">Terug naar oefenen</a>
  </main>;
}
