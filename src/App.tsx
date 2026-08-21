import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { AnalyticsTracker } from './context/AnalyticsTracker.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';

import { Header } from './components/common/Header.tsx';
import { Footer } from './components/common/Footer.tsx';
import { MobileBottomNav } from './components/common/MobileBottomNav.tsx';
import { AuthModal } from './components/common/AuthModal.tsx';
import { AgeGateModal } from './components/common/AgeGateModal.tsx';

import { HomeView } from './views/HomeView.tsx';
import { VideoDetailView } from './views/VideoDetailView.tsx';
import { CategoriesView } from './views/CategoriesView.tsx';
import { SearchView } from './views/SearchView.tsx';
import { CuratedView } from './views/CuratedView.tsx';
import { UserAccountView } from './views/UserAccountView.tsx';
import { AdminView } from './views/AdminView.tsx';

import type { Video } from './types/index.ts';

export function AppContent() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [viewPayload, setViewPayload] = useState<any>(null);

  // Age gate state (defaults to passed unless requested)
  const [ageGateOpen, setAgeGateOpen] = useState(false);

  // URL Deep-linking and initial routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('video');
    const viewParam = params.get('view');
    const queryParam = params.get('q');
    const path = window.location.pathname;

    if (path.includes('/admin') || viewParam === 'admin') {
      setCurrentView('admin');
      return;
    }

    if (videoId) {
      fetch(`/api/videos/${videoId}`)
        .then((r) => r.json())
        .then((v) => {
          if (v && !v.error) {
            setSelectedVideo(v);
            setCurrentView('video');
          }
        })
        .catch(() => {});
    } else if (queryParam) {
      setCurrentView('search');
      setViewPayload({ query: queryParam });
    } else if (viewParam) {
      setCurrentView(viewParam);
    }
  }, []);

  // Sync URL query when navigation happens
  const navigate = (view: string, payload?: any) => {
    setCurrentView(view);
    setViewPayload(payload);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const url = new URL(window.location.href);
    url.searchParams.delete('video');
    url.searchParams.delete('view');
    url.searchParams.delete('q');

    if (view === 'video' && payload?.id) {
      url.searchParams.set('video', payload.id);
    } else if (view === 'search' && payload?.query) {
      url.searchParams.set('q', payload.query);
    } else if (view !== 'home') {
      url.searchParams.set('view', view);
    }

    window.history.pushState({}, '', url.toString());
  };

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
    navigate('video', video);
  };

  // Determine current path for analytics tracking
  const currentAnalyticsPath =
    currentView === 'video' && selectedVideo
      ? `/watch/${selectedVideo.id}`
      : `/${currentView}`;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0F19] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Analytics Real-time Beacon */}
      <AnalyticsTracker
        currentPath={currentAnalyticsPath}
        currentVideoId={selectedVideo?.id}
      />

      {/* Header (hidden in admin panel for focused management UI) */}
      {currentView !== 'admin' && (
        <Header
          currentView={currentView}
          onNavigate={(view, payload) => navigate(view, payload)}
          onOpenSearch={() => navigate('search')}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <HomeView
            onSelectVideo={handleSelectVideo}
            onNavigate={(view, payload) => navigate(view, payload)}
          />
        )}

        {currentView === 'video' && selectedVideo && (
          <VideoDetailView
            key={selectedVideo.id}
            video={selectedVideo}
            onSelectVideo={handleSelectVideo}
            onNavigate={(view, payload) => navigate(view, payload)}
          />
        )}

        {currentView === 'categories' && (
          <CategoriesView
            initialCategoryId={viewPayload?.categoryId}
            onSelectVideo={handleSelectVideo}
          />
        )}

        {currentView === 'search' && (
          <SearchView
            initialQuery={viewPayload?.query || ''}
            onSelectVideo={handleSelectVideo}
          />
        )}

        {(currentView === 'latest' ||
          currentView === 'trending' ||
          currentView === 'popular' ||
          currentView === 'premium') && (
          <CuratedView
            type={currentView as any}
            onSelectVideo={handleSelectVideo}
          />
        )}

        {currentView === 'account' && (
          <UserAccountView
            initialTab={viewPayload?.tab || 'favorites'}
            onSelectVideo={handleSelectVideo}
            onNavigate={(v) => navigate(v)}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            onExit={() => navigate('home')}
            onSelectVideo={handleSelectVideo}
          />
        )}
      </main>

      {/* Footer (hidden in admin panel) */}
      {currentView !== 'admin' && <Footer onNavigate={(v, p) => navigate(v, p)} />}

      {/* Mobile Bottom Navigation Bar (hidden in admin panel) */}
      {currentView !== 'admin' && (
        <MobileBottomNav
          currentView={currentView}
          onNavigate={(v, p) => navigate(v, p)}
        />
      )}

      {/* Account Login / Register Modal */}
      <AuthModal />

      {/* Age Verification Gate (Compliance) */}
      <AgeGateModal
        isOpen={ageGateOpen}
        onConfirm={() => setAgeGateOpen(false)}
        onReject={() => (window.location.href = 'https://google.com')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
