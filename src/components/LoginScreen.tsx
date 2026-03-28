import { useState } from 'react';
import { sha256 } from '../services/authHash';

const DOCENT_HASH   = import.meta.env.VITE_DOCENT_HASH   ?? '';
const EIGENAAR_HASH = import.meta.env.VITE_EIGENAAR_HASH ?? '';
const EDITOR_HASH   = import.meta.env.VITE_EDITOR_HASH   ?? '';

// Session storage keys — kept in one place so screens can import them.
export const USAGE_SESSION_KEY    = 'usage-pin-ok';
export const EDITOR_SESSION_KEY   = 'editor-pin-ok';
export const EIGENAAR_SESSION_KEY = 'eigenaar-pin-ok';

type RoleOption = { value: string; label: string; hash: string };

const ROLES: RoleOption[] = [
  { value: 'docent',   label: 'Docent',       hash: DOCENT_HASH },
  { value: 'eigenaar', label: 'Eigenaar',      hash: EIGENAAR_HASH },
  { value: 'editor',   label: 'Zinnen-editor', hash: EDITOR_HASH },
];

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = ROLES.find(r => r.value === selectedRole);
    if (!role) return;

    sha256(password).then(hash => {
      if (hash !== role.hash) {
        setError(true);
        return;
      }

      if (selectedRole === 'docent') {
        sessionStorage.setItem(USAGE_SESSION_KEY, 'true');
        window.location.hash = '#/usage';
      } else if (selectedRole === 'eigenaar') {
        // Eigenaar gets access to everything
        sessionStorage.setItem(USAGE_SESSION_KEY, 'true');
        sessionStorage.setItem(EDITOR_SESSION_KEY, 'true');
        sessionStorage.setItem(EIGENAAR_SESSION_KEY, 'true');
        window.location.hash = '#/usage';
      } else if (selectedRole === 'editor') {
        sessionStorage.setItem(EDITOR_SESSION_KEY, 'true');
        window.location.hash = '#/editor';
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-sm w-full space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          Aanmelden
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Selecteer uw rol en voer het wachtwoord in.
        </p>

        {/* Hidden username field so browsers can distinguish saved credentials per role */}
        <input type="text" name="username" autoComplete="username" value={selectedRole} onChange={() => {}} className="sr-only" aria-hidden="true" tabIndex={-1} />

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Rol
          </label>
          <select
            value={selectedRole}
            onChange={e => { setSelectedRole(e.target.value); setError(false); setPassword(''); }}
            className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none text-sm"
          >
            <option value="">— Selecteer uw rol —</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {selectedRole && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Wachtwoord
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                className="w-full px-4 py-3 pr-12 text-lg border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none"
                autoFocus
                placeholder="Wachtwoord"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center font-medium">
            Onjuist wachtwoord
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { window.location.hash = '#/'; }}
            className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Terug
          </button>
          <button
            type="submit"
            disabled={!selectedRole || !password}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Open
          </button>
        </div>
      </form>
    </div>
  );
}
