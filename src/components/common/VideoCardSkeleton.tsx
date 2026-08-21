import React from 'react';

export const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 relative" />
      <div className="p-3.5 space-y-3">
        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800">
          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
};
