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
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              className="w-full px-4 py-3 text-lg border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none"
              autoFocus
              placeholder="Wachtwoord"
            />
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
