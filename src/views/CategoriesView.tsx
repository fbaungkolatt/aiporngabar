import React, { useState, useEffect } from 'react';
import { Compass, Film, ArrowLeft } from 'lucide-react';
import { VideoCard } from '../components/common/VideoCard.tsx';
import { VideoCardSkeleton } from '../components/common/VideoCardSkeleton.tsx';
import type { Category, Video } from '../types/index.ts';

interface CategoriesViewProps {
  initialCategoryId?: string;
  onSelectVideo: (video: Video) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  initialCategoryId,
  onSelectVideo,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'latest' | 'popular' | 'views'>('latest');

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data || []);
        if (initialCategoryId) {
          const matched = data.find((c) => c.id === initialCategoryId || c.slug === initialCategoryId);
          if (matched) setSelectedCategory(matched);
        }
      })
      .catch(() => {});
  }, [initialCategoryId]);

  // Fetch videos when selected category or sort changes
  useEffect(() => {
    if (!selectedCategory) {
      setVideos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/videos?category=${selectedCategory.id}&sort=${sort}&limit=24`)
      .then((r) => r.json())
      .then((data) => {
        setVideos(data.videos || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory, sort]);

  return (
    <div id="categories-view" className="space-y-8 pb-16">
      
      {/* If no category selected, show Category Cards Directory */}
      {!selectedCategory ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white">Explore Categories</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">Discover curated channels and master productions by genre</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => setSelectedCategory(cat)}
                className="group p-6 rounded-2xl bg-[#F5F8FF] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-850 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <Film className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#1769FF] dark:text-blue-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-xs">
                      {cat.videoCount || 0} Videos
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] dark:text-white group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center text-xs font-bold text-[#1769FF] dark:text-blue-400">
                  <span>Browse Channel &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Category Videos Grid */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:text-[#1769FF] dark:hover:text-blue-400 hover:border-[#1769FF] transition-colors shadow-xs"
                aria-label="Back to all categories"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
                  <span>{selectedCategory.name}</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-[#F5F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                    {videos.length} videos
                  </span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400">{selectedCategory.description}</p>
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-gray-800 dark:text-slate-100 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
              >
                <option value="latest">Latest Released</option>
                <option value="popular">Most Popular</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
              : videos.map((v) => (
                  <VideoCard key={v.id} video={v} onClick={onSelectVideo} showCategory={false} />
                ))}
          </div>

          {!loading && videos.length === 0 && (
            <div className="text-center py-16 bg-[#F5F8FF] dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-gray-500 dark:text-slate-400">No videos currently published in this category.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
