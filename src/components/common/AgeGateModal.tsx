import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AgeGateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({ isOpen, onConfirm, onReject }) => {
  if (!isOpen) return null;

  return (
    <div id="age-verification-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-slate-800 text-center">
        
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Age Verification Required</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
          This section contains content classified for mature audiences according to applicable media distribution laws. Please confirm that you are at least 18 years of age (or the age of majority in your jurisdiction) to proceed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            I am Under 18 (Exit)
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] shadow-md shadow-blue-500/20 transition-all"
          >
            I am 18 or Older (Enter)
          </button>
        </div>

        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-4">
          Porn Gabar operates in compliance with international digital broadcasting and content classification standards.
        </p>
      </div>
    </div>
  );
};
