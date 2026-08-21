import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import type { Advertisement, AdPlacement } from '../../types/index.ts';

interface AdBannerProps {
  placement: AdPlacement;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    fetch(`/api/ads/active?placement=${placement}&isMobile=${isMobile}`)
      .then((res) => res.json())
      .then((ads: Advertisement[]) => {
        if (ads && ads.length > 0) {
          // Select top priority / weighted rotation
          const chosen = ads[Math.floor(Math.random() * Math.min(ads.length, 3))];
          setAd(chosen);
          // Record impression
          fetch(`/api/ads/${chosen.id}/impression`, { method: 'POST' }).catch(() => {});
        }
      })
      .catch((err) => console.error('Failed to load ad placement:', err));
  }, [placement]);

  if (!ad) return null;

  const handleAdClick = () => {
    fetch(`/api/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    if (ad.targetUrl) {
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // If the ad has a raw HTML code snippet (e.g. ExoClick <a><img> snippet)
  if (ad.adType === 'html_code' || ad.codeSnippet) {
    return (
      <div
        id={`ad-unit-${ad.id}`}
        className={`w-full flex flex-col items-center justify-center p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden ${className}`}
      >
        <div className="w-full flex items-center justify-between px-2 pb-1 text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 tracking-wider">
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-[#1769FF]" />
            Advertisement {ad.adSize ? `(${ad.adSize})` : ''}
          </span>
          <span className="text-[9px] hover:text-[#1769FF] cursor-pointer" onClick={handleAdClick}>
            ExoClick Network
          </span>
        </div>
        <div
          onClick={handleAdClick}
          className="flex items-center justify-center w-full overflow-hidden max-w-full cursor-pointer transition-opacity hover:opacity-95"
          dangerouslySetInnerHTML={{
            __html:
              ad.codeSnippet ||
              `<a href="${ad.targetUrl}" target="_blank" rel="noopener noreferrer"><img src="${ad.bannerImage}" border="0" alt="${ad.name}" style="max-width:100%; height:auto; display:block; margin:0 auto; border-radius:8px;" /></a>`,
          }}
        />
      </div>
    );
  }

  // Top Banner / Bottom Banner Format
  if (placement === 'top_banner' || placement === 'bottom_banner') {
    return (
      <div
        id={`ad-unit-${ad.id}`}
        onClick={handleAdClick}
        className={`relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#0B3DCC]/90 to-[#1769FF] text-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white/20 shrink-0 border border-white/30">
              <img src={ad.bannerImage} alt={ad.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded text-blue-100">
                  Featured Sponsor
                </span>
                <span className="text-xs font-semibold text-blue-100">{ad.name}</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-1">{ad.title || ad.name}</h4>
              {ad.tagline && <p className="text-xs text-blue-100/90 line-clamp-1 mt-0.5">{ad.tagline}</p>}
            </div>
          </div>

          <button
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#1769FF] text-xs font-bold shadow hover:bg-blue-50 transition-colors"
          >
            <span>Learn More</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Sidebar Ad Format
  if (placement === 'sidebar') {
    return (
      <div
        id={`ad-unit-${ad.id}`}
        onClick={handleAdClick}
        className={`bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group ${className}`}
      >
        <div className="relative aspect-[4/3] bg-gray-900">
          <img src={ad.bannerImage} alt={ad.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded">
            Sponsored
          </span>
        </div>
        <div className="p-4 space-y-2">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors">{ad.title || ad.name}</h4>
          {ad.tagline && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{ad.tagline}</p>}
          <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#1769FF] dark:text-blue-400">
            <span>Explore Partner</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // Home Feed Sponsored Card
  return (
    <div
      id={`ad-unit-${ad.id}`}
      onClick={handleAdClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${className}`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
        <img src={ad.bannerImage} alt={ad.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#1769FF] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
          <Sparkles className="w-3 h-3" />
          <span>SPONSORED</span>
        </div>
      </div>
      <div className="p-3.5">
        <span className="text-[11px] font-semibold text-[#1769FF] dark:text-blue-400 uppercase tracking-wider">{ad.name}</span>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors line-clamp-2 mt-1">
          {ad.title || ad.name}
        </h3>
        {ad.tagline && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1">{ad.tagline}</p>}
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#1769FF] dark:text-blue-400">
          <span>Visit Official Partner</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
