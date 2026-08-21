import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { VideoCard } from '../components/common/VideoCard.tsx';
import { VideoCardSkeleton } from '../components/common/VideoCardSkeleton.tsx';
import type { Video, Category } from '../types/index.ts';

interface SearchViewProps {
  initialQuery?: string;
  onSelectVideo: (video: Video) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ initialQuery = '', onSelectVideo }) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sort, setSort] = useState<'latest' | 'popular' | 'views'>('latest');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories for chip filters
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data || []))
      .catch(() => {});
  }, []);

  // Search API Call
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (premiumOnly) params.append('premium', 'true');
      params.append('sort', sort);
      params.append('limit', '30');

      fetch(`/api/videos?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => setResults(data.videos || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, sort, premiumOnly]);

  return (
    <div id="search-view" className="space-y-6 pb-16">
      
      {/* Search Bar Input */}
      <div className="bg-[#F5F8FF] dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search thousands of 4K cinematic titles, topics, creators..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-10 py-3.5 text-sm sm:text-base text-[#111827] dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1769FF] shadow-xs"
            autoFocus
          />
          <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Category Chips Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#1769FF] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-[#1769FF] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Sort & Premium Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPremiumOnly(!premiumOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                premiumOnly
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              👑 Premium Only
            </button>

            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="views">Views</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-bold text-gray-700 dark:text-slate-300">
          {query ? `Results for "${query}"` : 'Discover Catalog'}
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-slate-500">({results.length} titles found)</span>
        </h2>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
          : results.map((v) => <VideoCard key={v.id} video={v} onClick={onSelectVideo} />)}
      </div>

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No videos found matching your query</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            Try searching for terms like "Ocean", "Wildlife", "Cinema", "Documentary", or select a category chip above.
          </p>
        </div>
      )}

    </div>
  );
};
