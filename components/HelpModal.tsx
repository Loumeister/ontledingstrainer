import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-extrabold text-slate-800">Instructies</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content - Based on HANDLEIDING.md */}
        <div className="p-6 md:p-8 space-y-6 text-slate-700 leading-relaxed">
          
          <section>
            <h3 className="text-lg font-bold text-blue-600 mb-2">Hoe werkt de app?</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="font-bold text-slate-900">Stap 1: Verdelen</p>
                  <p>Klik tussen de woorden om de zin in stukjes te knippen. Foutje? Klik nog een keer op het schaartje om te plakken.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="font-bold text-slate-900">Stap 2: Benoemen</p>
                  <p>Sleep de gekleurde kaartjes naar het juiste zinsdeel. Je kunt ook op specifieke woorden slepen (zoals bij een bijvoeglijke bepaling).</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-bold text-blue-600 mb-2">Instellingen op het startscherm</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <strong className="text-slate-900 block">Moeilijkheidsgraad</strong>
                Kies voor Basis, Middel of Hoog. Bij 'Alles' krijg je een mix. Samengestelde zinnen zitten apart.
              </li>
              <li>
                <strong className="text-slate-900 block">Specifiek Oefenen (Focus)</strong>
                Wil je trainen op één onderdeel (bijvoorbeeld Lijdend Voorwerp)? Vink dit aan. De app zoekt dan alleen zinnen uit die dit onderdeel hebben.
              </li>
              <li>
                <strong className="text-slate-900 block">Onderdelen (Moeilijkheid)</strong>
                Vinkjes hier bepalen of moeilijke onderdelen (zoals Bijstellingen) in de zinnen mogen voorkomen. Zet ze uit om het makkelijker te maken.
              </li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800">
            <strong>💡 Tip:</strong> Gebruik de knop <em>"Geef Hint"</em> als je vastloopt. De app vertelt je dan welk zinsdeel je eerst moet zoeken!
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center sticky bottom-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ik snap het!
          </button>
        </div>
      </div>
    </div>
  );
};
