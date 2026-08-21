import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import type { Video } from '../../types/index.ts';

interface ShareModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ video, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = window.location.origin + `?video=${video.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    fetch(`/api/videos/${video.id}/share`, { method: 'POST' }).catch(() => {});
    setTimeout(() => setCopied(false), 3000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Watch "${video.title}" on Porn Gabar`,
        url: shareUrl,
      }).catch(() => {});
    }
  };

  return (
    <div id="share-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Share Video</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">"{video.title}"</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
              Direct Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-slate-200 select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl border border-blue-200 dark:border-slate-700 text-xs font-bold text-[#1769FF] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via Device Apps</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
