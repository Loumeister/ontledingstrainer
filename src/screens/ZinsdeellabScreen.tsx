/**
 * ZinsdeellabScreen — Placeholder voor de Zinsdeellab-route (#/zinsdeellab).
 *
 * Dit scherm vestigt de route en de prop-interface voor toekomstige MVPs.
 * De volledige bouw-UI (FrameSlot, ChunkBank, enz.) wordt in een volgende sprint gebouwd.
 */

interface ZinsdeellabScreenProps {
  darkMode: boolean;
  largeFont: boolean;
  dyslexiaMode: boolean;
  onClose: () => void;
}

export function ZinsdeellabScreen({
  darkMode,
  largeFont,
  onClose,
}: ZinsdeellabScreenProps) {
  return (
    <div
      className={`min-h-screen flex flex-col ${
        darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      } ${largeFont ? 'text-lg' : 'text-base'}`}
    >
      <header className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-label="Terug naar hoofdmenu"
        >
          ← Terug
        </button>
        <h1 className="font-bold text-xl">Zinsdeellab</h1>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-400 dark:text-gray-500 text-center">
          Zinsdeellab wordt binnenkort beschikbaar.
        </p>
      </main>
    </div>
  );
}
