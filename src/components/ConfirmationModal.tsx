import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
    >
       <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
          aria-describedby="confirmation-modal-message"
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full animate-in zoom-in-95 duration-200"
       >
          <h3 id="confirmation-modal-title" className="text-lg font-bold mb-2 text-slate-800 dark:text-white">{title}</h3>
          <p id="confirmation-modal-message" className="text-slate-600 dark:text-slate-300 mb-6 text-sm">{message}</p>
          <div className="flex gap-3 justify-end">
             <button
               onClick={onCancel}
               className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
             >
               Nee, ga terug
             </button>
             <button
               onClick={onConfirm}
               className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-sm transition-colors"
             >
               Ja, zeker
             </button>
          </div>
       </div>
    </div>
  );
};
