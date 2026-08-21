import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Video, WatchHistoryItem } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  favorites: Video[];
  isFavorite: (videoId: string) => boolean;
  toggleFavorite: (videoId: string) => Promise<boolean>;
  history: (WatchHistoryItem & { video?: Video })[];
  recordHistory: (videoId: string, progressSeconds: number, durationSeconds: number) => Promise<void>;
  clearHistory: (videoId?: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bluewave_user_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<Video[]>([]);
  const [history, setHistory] = useState<(WatchHistoryItem & { video?: Video })[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Fetch Favorites
  const refreshFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      return;
    }
    try {
      const res = await fetch('/api/user/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, [token]);

  // Fetch Watch History
  const refreshHistory = useCallback(async () => {
    if (!token) {
      setHistory([]);
      return;
    }
    try {
      const res = await fetch('/api/user/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load watch history:', err);
    }
  }, [token]);

  // Load User Profile on token init
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          await Promise.all([refreshFavorites(), refreshHistory()]);
        } else {
          // Token expired or invalid
          localStorage.removeItem('bluewave_user_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('User load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token, refreshFavorites, refreshHistory]);

  // Login
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('bluewave_user_token', data.token);
      setToken(data.token);
      setUser(data.user);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Register
  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.setItem('bluewave_user_token', data.token);
      setToken(data.token);
      setUser(data.user);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('bluewave_user_token');
    setToken(null);
    setUser(null);
    setFavorites([]);
    setHistory([]);
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  // Update Profile
  const updateProfile = async (data: Partial<User>) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Favorites checks
  const isFavorite = (videoId: string) => {
    return favorites.some((v) => v.id === videoId);
  };

  const toggleFavorite = async (videoId: string): Promise<boolean> => {
    if (!token) {
      openAuthModal('login');
      return false;
    }

    try {
      const res = await fetch(`/api/user/favorites/${videoId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        await refreshFavorites();
        return data.isFavorite;
      }
      return false;
    } catch (err) {
      console.error('Favorite toggle failed:', err);
      return false;
    }
  };

  // Watch history tracking
  const recordHistory = async (videoId: string, progressSeconds: number, durationSeconds: number) => {
    if (!token) return;
    try {
      await fetch('/api/user/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId, progressSeconds, durationSeconds }),
      });
      // Optionally update local history
    } catch (err) {
      console.error('Failed to record watch history:', err);
    }
  };

  const clearHistory = async (videoId?: string) => {
    if (!token) return;
    try {
      const url = videoId ? `/api/user/history/${videoId}` : '/api/user/history';
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await refreshHistory();
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        favorites,
        isFavorite,
        toggleFavorite,
        history,
        recordHistory,
        clearHistory,
        refreshFavorites,
        refreshHistory,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
