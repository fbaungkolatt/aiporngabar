import React from 'react';
import { Bookmark, Crown, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Video } from '../../types/index.ts';

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
  showCategory?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const { isFavorite, toggleFavorite } = useAuth();
  const bookmarked = isFavorite(video.id);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(video.id);
  };

  const formattedViews =
    video.views >= 1000000
      ? (video.views / 1000000).toFixed(1) + 'M'
      : video.views >= 1000
      ? (video.views / 1000).toFixed(1) + 'K'
      : video.views.toString();

  return (
    <div
      id={`video-card-${video.id}`}
      onClick={() => onClick(video)}
      className="group cursor-pointer flex flex-col"
    >
      {/* Thumbnail Aspect Container */}
      <div className="aspect-video bg-[#F5F8FF] dark:bg-slate-800/80 rounded-2xl overflow-hidden mb-3 relative shadow-sm border border-slate-100 dark:border-slate-800 group-hover:shadow-md transition-all">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-[#1769FF] dark:text-blue-400 flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
          {video.durationFormatted}
        </div>

        {/* Bookmark Action */}
        <button
          id={`bookmark-btn-${video.id}`}
          onClick={handleBookmarkClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm transition-all ${
            bookmarked
              ? 'bg-[#1769FF] text-white opacity-100'
              : 'bg-white/90 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 hover:text-[#1769FF] opacity-0 group-hover:opacity-100'
          }`}
          title={bookmarked ? 'Remove Bookmark' : 'Add to Favorites'}
          aria-label="Bookmark video"
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Premium Tag */}
        {video.isPremium && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 text-[#1769FF] dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
            <Crown className="w-3 h-3" />
            <span>PRO</span>
          </div>
        )}
      </div>

      {/* Meta Content */}
      <h3 className="font-bold text-sm text-[#111827] dark:text-slate-100 line-clamp-1 group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors leading-snug">
        {video.title}
      </h3>

      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
        <span className="bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold text-[9px] truncate max-w-[120px]">
          {video.category}
        </span>
        <span>•</span>
        <span>{formattedViews} Views</span>
        <span>•</span>
        <span className="truncate">{video.contentOwner ? video.contentOwner.slice(0, 16) : 'Porn Gabar'}</span>
      </div>
    </div>
  );
};
