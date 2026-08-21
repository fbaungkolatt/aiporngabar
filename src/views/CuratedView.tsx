import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, TrendingUp, Crown } from 'lucide-react';
import { VideoCard } from '../components/common/VideoCard.tsx';
import { VideoCardSkeleton } from '../components/common/VideoCardSkeleton.tsx';
import type { Video } from '../types/index.ts';

interface CuratedViewProps {
  type: 'latest' | 'trending' | 'popular' | 'premium';
  onSelectVideo: (video: Video) => void;
}

export const CuratedView: React.FC<CuratedViewProps> = ({ type, onSelectVideo }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = {
    latest: {
      title: 'Latest Releases',
      description: 'Newly uploaded cinematic master files and seasonal episodes.',
      icon: Sparkles,
    },
    trending: {
      title: 'Trending Videos',
      description: 'The fastest rising titles with surging global viewer engagement.',
      icon: Flame,
    },
    popular: {
      title: 'Most Popular',
      description: 'All-time most viewed, highest rated masterpieces on Porn Gabar.',
      icon: TrendingUp,
    },
    premium: {
      title: 'Porn Gabar Originals (Premium)',
      description: 'Ultra-high-definition 4K HDR master productions exclusive to Porn Gabar.',
      icon: Crown,
    },
  }[type];

  const Icon = meta.icon;

  useEffect(() => {
    setLoading(true);
    let url = `/api/videos?sort=${type}&limit=24`;
    if (type === 'premium') {
      url = `/api/videos?premium=true&limit=24`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => setVideos(data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div id={`curated-${type}-view`} className="space-y-8 pb-16">
      
      {/* Banner */}
      <div className="flex items-center justify-between bg-[#F5F8FF] dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 flex items-center justify-center shadow-sm">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white">{meta.title}</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
          : videos.map((v) => <VideoCard key={v.id} video={v} onClick={onSelectVideo} />)}
      </div>

    </div>
  );
};
