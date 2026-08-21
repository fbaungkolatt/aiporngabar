import React, { useState, useEffect } from 'react';
import { Play, Bookmark, Flame, Sparkles, TrendingUp, Crown, Compass, ArrowRight, Eye, Film } from 'lucide-react';
import { VideoCard } from '../components/common/VideoCard.tsx';
import { VideoCardSkeleton } from '../components/common/VideoCardSkeleton.tsx';
import { AdBanner } from '../components/common/AdBanner.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { Video, Category } from '../types/index.ts';

interface HomeViewProps {
  onSelectVideo: (video: Video) => void;
  onNavigate: (view: string, payload?: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectVideo, onNavigate }) => {
  const { isFavorite, toggleFavorite } = useAuth();

  const [featured, setFeatured] = useState<Video | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [latestVideos, setLatestVideos] = useState<Video[]>([]);
  const [popularVideos, setPopularVideos] = useState<Video[]>([]);
  const [premiumVideos, setPremiumVideos] = useState<Video[]>([]);
  const [natureVideos, setNatureVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeContent() {
      setLoading(true);
      try {
        const [featRes, catRes, trendRes, latestRes, popRes, premRes, natRes] = await Promise.all([
          fetch('/api/videos/featured').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/videos?sort=trending&limit=6').then((r) => r.json()),
          fetch('/api/videos?sort=latest&limit=6').then((r) => r.json()),
          fetch('/api/videos?sort=popular&limit=6').then((r) => r.json()),
          fetch('/api/videos?premium=true&limit=6').then((r) => r.json()),
          fetch('/api/videos?category=cat-nature&limit=6').then((r) => r.json()),
        ]);

        setFeatured(featRes);
        setCategories(catRes || []);
        setTrendingVideos(trendRes.videos || []);
        setLatestVideos(latestRes.videos || []);
        setPopularVideos(popRes.videos || []);
        setPremiumVideos(premRes.videos || []);
        setNatureVideos(natRes.videos || []);
      } catch (err) {
        console.error('Failed loading homepage streams:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeContent();
  }, []);

  const isHeroBookmarked = featured ? isFavorite(featured.id) : false;

  return (
    <div id="home-view" className="space-y-12 pb-12">
      
      {/* 1. Hero Featured Section (Clean Minimalism Archetype) */}
      {featured && (
        <section
          id="hero-featured-section"
          className="relative min-h-[340px] md:h-[360px] rounded-3xl overflow-hidden bg-[#F5F8FF] dark:bg-slate-900/80 flex flex-col md:flex-row shadow-sm border border-slate-100 dark:border-slate-800"
        >
          {/* Hero Left Content */}
          <div className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-center gap-4 z-10">
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 text-xs font-bold rounded-full shadow-sm uppercase tracking-wider">
                Featured Spotlight
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-full shadow-xs">
                {featured.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-tight">
              {featured.title}
            </h1>

            <p className="text-gray-500 dark:text-slate-400 max-w-md text-sm sm:text-base leading-relaxed line-clamp-2">
              {featured.description}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 mt-2">
              <button
                id="hero-watch-now-btn"
                onClick={() => onSelectVideo(featured)}
                className="bg-[#1769FF] text-white px-7 py-3 rounded-2xl font-bold flex items-center gap-2.5 hover:bg-[#0B3DCC] transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 text-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Watch Now</span>
              </button>

              <button
                id="hero-favorite-btn"
                onClick={() => toggleFavorite(featured.id)}
                className="bg-white dark:bg-slate-800 text-[#111827] dark:text-slate-100 px-5 py-3 rounded-2xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm text-sm cursor-pointer"
              >
                <Bookmark className={`w-4 h-4 ${isHeroBookmarked ? 'fill-[#1769FF] text-[#1769FF]' : ''}`} />
                <span>{isHeroBookmarked ? 'In My List' : 'My List'}</span>
              </button>
            </div>
          </div>

          {/* Hero Right Visual Element */}
          <div className="hidden lg:flex relative w-1/2 p-8 items-center justify-end">
            <div className="relative w-[380px] h-[230px] rounded-2xl shadow-2xl rotate-1 overflow-hidden border-4 border-white dark:border-slate-700 group cursor-pointer" onClick={() => onSelectVideo(featured)}>
              <img
                src={featured.thumbnailUrl}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                <div className="flex items-center justify-between w-full text-white">
                  <span className="text-xs font-bold">{featured.durationFormatted}</span>
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 text-[#1769FF] dark:text-blue-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Top Banner Advertisement */}
      <AdBanner placement="top_banner" />

      {/* 2. Categories Quick Filter Pills */}
      {categories.length > 0 && (
        <section id="category-pills-bar" className="overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2.5 min-w-max">
            <button
              onClick={() => onNavigate('categories')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] dark:bg-slate-800 text-white text-xs font-bold shadow-sm hover:bg-black dark:hover:bg-slate-700 transition-colors"
            >
              <Compass className="w-4 h-4 text-[#1769FF] dark:text-blue-400" />
              <span>All Categories</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('categories', { categoryId: cat.id })}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-[#1769FF] dark:hover:text-blue-400 hover:border-[#1769FF] dark:hover:border-blue-500 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>{cat.name}</span>
                {cat.videoCount !== undefined && (
                  <span className="text-[10px] text-[#1769FF] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-full font-bold">
                    {cat.videoCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. Trending Videos Section */}
      <section id="trending-videos-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Trending Now</h2>
          </div>
          <button
            onClick={() => onNavigate('trending')}
            className="text-[#1769FF] dark:text-blue-400 text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
            : trendingVideos.map((video) => (
                <VideoCard key={video.id} video={video} onClick={onSelectVideo} />
              ))}
        </div>
      </section>

      {/* 4. Latest Releases Section */}
      <section id="latest-videos-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Latest Releases</h2>
          </div>
          <button
            onClick={() => onNavigate('latest')}
            className="text-[#1769FF] dark:text-blue-400 text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
            : latestVideos.map((video) => (
                <VideoCard key={video.id} video={video} onClick={onSelectVideo} />
              ))}
        </div>
      </section>

      {/* Feed Sponsored Card / Native Ad */}
      <div className="my-6">
        <AdBanner placement="home_feed" />
      </div>

      {/* 5. Porn Gabar Originals / Premium Spotlight */}
      <section id="premium-originals-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Porn Gabar Originals</h2>
          </div>
          <button
            onClick={() => onNavigate('premium')}
            className="text-[#1769FF] dark:text-blue-400 text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 transition-colors"
          >
            <span>Explore Premium</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
            : premiumVideos.map((video) => (
                <VideoCard key={video.id} video={video} onClick={onSelectVideo} />
              ))}
        </div>
      </section>

      {/* 6. Most Popular Cinema & Series */}
      <section id="popular-videos-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Most Popular</h2>
          </div>
          <button
            onClick={() => onNavigate('popular')}
            className="text-[#1769FF] dark:text-blue-400 text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
            : popularVideos.map((video) => (
                <VideoCard key={video.id} video={video} onClick={onSelectVideo} />
              ))}
        </div>
      </section>

      {/* 7. Nature & Expeditions Channel */}
      {natureVideos.length > 0 && (
        <section id="nature-channel-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Expeditions & Nature</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
            {natureVideos.map((video) => (
              <VideoCard key={video.id} video={video} onClick={onSelectVideo} />
            ))}
          </div>
        </section>
      )}

      {/* Bottom Banner Advertisement */}
      <AdBanner placement="bottom_banner" />

    </div>
  );
};
