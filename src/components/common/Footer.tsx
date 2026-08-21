import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [liveCount, setLiveCount] = useState(24102);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCount((prev) => prev + Math.floor(Math.random() * 7) - 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer id="main-footer" className="h-16 md:h-14 w-full px-4 sm:px-8 bg-white dark:bg-[#0F172A] border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 dark:text-slate-400 gap-3 shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-6">
        <span>&copy; {new Date().getFullYear()} Porn Gabar</span>
        <button onClick={() => onNavigate('home')} className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
          Terms of Service
        </button>
        <button onClick={() => onNavigate('home')} className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
          Privacy Policy
        </button>
        <button onClick={() => onNavigate('home')} className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors hidden md:inline">
          Cookie Settings
        </button>
      </div>

      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 font-medium">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>{liveCount.toLocaleString()} active viewers</span>
        </span>
        <button
          id="footer-admin-btn"
          onClick={() => onNavigate('admin')}
          className="font-bold text-[#1769FF] dark:text-blue-400 hover:underline uppercase tracking-tight text-[11px] opacity-90 flex items-center gap-1"
        >
          <Shield className="w-3 h-3" />
          <span>System Portal</span>
        </button>
      </div>
    </footer>
  );
};
