import { useEffect, useRef, useState } from 'react';
import { api } from '../services/secureApi';
import type { AccountSession } from '../services/secureApi';

interface GoogleIdentity {
  initialize(options: { client_id: string; nonce: string; callback: (result: { credential: string }) => void; auto_select: boolean }): void;
  renderButton(element: HTMLElement, options: { type: string; theme: string; text: string }): void;
  disableAutoSelect(): void;
}
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }

export default function LoginScreen() {
  const button = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('Aanmelden laden…');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let script: HTMLScriptElement | undefined;
    const initialize = async () => {
      try {
        const { clientId, nonce } = await api<{ clientId: string; nonce: string }>('/auth/challenge', {});
        if (!window.google) await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error('Google-aanmelding kon niet laden.')), 10000);
          script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
          script.onload = () => { window.clearTimeout(timeout); resolve(); };
          script.onerror = () => { window.clearTimeout(timeout); reject(new Error('Google-aanmelding kon niet laden.')); };
          document.head.appendChild(script);
        });
        if (!active || !button.current || !window.google) return;
        button.current.replaceChildren();
        window.google.accounts.id.initialize({ client_id: clientId, nonce, auto_select: false,
          callback: ({ credential }) => {
            setMessage('Aanmelding controleren…');
            // Token exists only for this POST, never in storage, URLs or logs.
            void api<AccountSession>('/auth/login', { credential }).then(user => {
              if (active) window.location.hash = user.role === 'editor' ? '#/editor' : '#/usage';
            }).catch(error => { if (active) setMessage(error.message); });
          },
        });
        window.google.accounts.id.renderButton(button.current, { type: 'standard', theme: 'outline', text: 'signin_with' });
        setMessage('Gebruik het Google-account dat je beheerder heeft toegestaan.');
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : 'Aanmelden niet beschikbaar.'); }
    };
    void initialize();
    return () => { active = false; script?.remove(); };
  }, [retry]);
  return <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
    <section className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-sm w-full space-y-4 text-slate-800 dark:text-white">
      <h1 className="text-xl font-bold">Aanmelden voor docenten</h1>
      <p role="status" className="text-sm">{message}</p>
      <div ref={button} />
      <button type="button" onClick={() => setRetry(v => v + 1)} className="text-blue-600 underline">Opnieuw laden</button>
      <a href="#/" className="block underline">Terug naar oefenen</a>
    </section>
  </main>;
}
