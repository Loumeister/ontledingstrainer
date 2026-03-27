import { useState } from 'react';
import { sha256 } from '../services/authHash';

const DOCENT_HASH = import.meta.env.VITE_DOCENT_HASH ?? '';
const EIGENAAR_HASH = import.meta.env.VITE_EIGENAAR_HASH ?? '';
const EDITOR_HASH = import.meta.env.VITE_EDITOR_HASH ?? '';

export type AuthRole = 'docent' | 'eigenaar' | 'editor';

type RoleOption = { value: AuthRole; label: string; hash: string };

const ALL_ROLES: RoleOption[] = [
  { value: 'docent',   label: 'Docent',        hash: DOCENT_HASH },
  { value: 'eigenaar', label: 'Eigenaar',       hash: EIGENAAR_HASH },
  { value: 'editor',   label: 'Zinnen-editor',  hash: EDITOR_HASH },
];

interface LoginScreenProps {
  /** Which roles to show in the dropdown. Eigenaar is always appended if not already included. */
  allowedRoles: AuthRole[];
  onBack: () => void;
  onAuthenticated: (role: AuthRole) => void;
}

export default function LoginScreen({ allowedRoles, onBack, onAuthenticated }: LoginScreenProps) {
  // Eigenaar can always log in from any screen
  const roleKeys = Array.from(new Set([...allowedRoles, 'eigenaar' as AuthRole]));
  const roles = ALL_ROLES.filter(r => roleKeys.includes(r.value));

  const [selectedRole, setSelectedRole] = useState<AuthRole | ''>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    const role = roles.find(r => r.value === selectedRole)!;
    sha256(password).then(hash => {
      if (hash === role.hash) {
        onAuthenticated(selectedRole);
      } else {
        setError(true);
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
            onChange={e => { setSelectedRole(e.target.value as AuthRole | ''); setError(false); setPassword(''); }}
            className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none text-sm"
          >
            <option value="">— Selecteer uw rol —</option>
            {roles.map(r => (
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
            onClick={onBack}
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
