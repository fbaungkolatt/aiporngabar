import React, { useState } from 'react';
import {
  User as UserIcon,
  Bookmark,
  History,
  LogOut,
  Play,
  Trash2,
  CheckCircle2,
  Clock,
  Heart,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { Video } from '../types/index.ts';

interface UserAccountViewProps {
  initialTab?: 'favorites' | 'history' | 'profile';
  onSelectVideo: (video: Video) => void;
  onNavigate: (view: string) => void;
}

export const UserAccountView: React.FC<UserAccountViewProps> = ({
  initialTab = 'favorites',
  onSelectVideo,
  onNavigate,
}) => {
  const {
    user,
    logout,
    favorites,
    toggleFavorite,
    history,
    clearHistory,
    updateProfile,
  } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'profile'>(initialTab);
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in to Access Your Account</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
          Create an account or sign in to sync favorites across devices, track your watch history, and manage your streaming profile.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC]"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProfile({ name: name.trim(), avatarUrl: avatarUrl.trim() });
    if (ok) {
      showToast('Profile updated successfully', 'success');
    } else {
      showToast('Failed to update profile', 'error');
    }
    setSaving(false);
  };

  return (
    <div id="user-account-view" className="space-y-8 pb-20 max-w-6xl mx-auto">
      
      {/* Profile Header Banner */}
      <div className="bg-[#F5F8FF] dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white">{user.name}</h1>
              {user.role === 'admin' && (
                <span className="text-[10px] font-bold text-white bg-[#0B3DCC] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Staff Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-[#1769FF] dark:text-blue-400 font-semibold">
              <span className="flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5" />
                {favorites.length} Saved
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                {history.length} Watched
              </span>
            </div>
          </div>
        </div>

        <button
          id="account-logout-btn"
          onClick={() => {
            logout();
            onNavigate('home');
            showToast('Signed out successfully', 'info');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors self-end sm:self-center shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex bg-[#F5F8FF] dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs max-w-md">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'favorites'
              ? 'bg-[#1769FF] text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Favorites ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-[#1769FF] text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Watch History ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'profile'
              ? 'bg-[#1769FF] text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab 1: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Saved Bookmarks</h3>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-3">
              <Bookmark className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Your bookmark collection is empty</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                Click the bookmark button on any video card or player page to save videos for offline or future viewing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((v) => (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-video bg-gray-900 cursor-pointer" onClick={() => onSelectVideo(v)}>
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      {v.durationFormatted}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 line-clamp-2">{v.title}</h4>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                      <button
                        onClick={() => onSelectVideo(v)}
                        className="text-xs font-bold text-[#1769FF] dark:text-blue-400 flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch</span>
                      </button>
                      <button
                        onClick={() => toggleFavorite(v.id)}
                        className="text-xs text-gray-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Watch History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Watch History</h3>
            {history.length > 0 && (
              <button
                onClick={() => clearHistory()}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-3">
              <History className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">No watch history yet</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                Videos you watch will appear here so you can easily resume right where you left off.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const vid = item.video;
                if (!vid) return null;
                const percent = Math.min(100, Math.round((item.progressSeconds / Math.max(1, item.durationSeconds)) * 100));

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="relative w-32 aspect-video bg-gray-900 rounded-xl overflow-hidden shrink-0 cursor-pointer"
                        onClick={() => onSelectVideo(vid)}
                      >
                        <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-700">
                          <div className="h-full bg-[#1769FF]" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#1769FF] dark:text-blue-400 uppercase">{vid.category}</span>
                        <h4
                          onClick={() => onSelectVideo(vid)}
                          className="text-xs font-bold text-gray-900 dark:text-slate-100 hover:text-[#1769FF] dark:hover:text-blue-400 transition-colors line-clamp-1 cursor-pointer"
                        >
                          {vid.title}
                        </h4>
                        <div className="text-[11px] text-gray-400 dark:text-slate-400 flex items-center gap-2">
                          <span>{percent}% watched</span>
                          <span>•</span>
                          <span>{new Date(item.lastWatchedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onSelectVideo(vid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                      <button
                        onClick={() => clearHistory(item.videoId)}
                        className="p-1.5 rounded-xl text-gray-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Remove from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Account Preferences</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Update your public creator and viewer display information.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 dark:text-slate-500 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
