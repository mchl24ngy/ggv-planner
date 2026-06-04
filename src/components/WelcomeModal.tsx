import React from 'react';
import { Zap } from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';

interface WelcomeModalProps {
  onStart: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStart, onSkip }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="flex justify-center mb-5">
          <div className="bg-blue-100 rounded-full p-4">
            <Zap className="text-blue-600" size={36} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-3">{t.tutorialWelcomeTitle}</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">{t.tutorialWelcomeText}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onStart}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            {t.tutorialBtnStart}
          </button>
          <button
            onClick={onSkip}
            className="w-full px-6 py-2 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
          >
            {t.tutorialBtnSkip}
          </button>
        </div>
      </div>
    </div>
  );
};
