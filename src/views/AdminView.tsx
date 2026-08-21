import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  LayoutDashboard,
  Film,
  Grid,
  Megaphone,
  Flag,
  BarChart3,
  Radio,
  History,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  LogOut,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  Crown,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Search,
  Check,
  X,
  ArrowUpDown,
  Code2,
  Copy,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { EXOCLICK_PRESETS } from '../data/exoclickPresets.ts';
import type { Video, Category, Advertisement, ContentReport, AuditLog } from '../types/index.ts';

interface AdminViewProps {
  onExit: () => void;
  onSelectVideo: (video: Video) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onExit, onSelectVideo }) => {
  const { admin, token, login, logout, isLoading } = useAdminAuth();
  const { showToast } = useToast();

  // Navigation tab
  const [tab, setTab] = useState<
    'overview' | 'videos' | 'categories' | 'ads' | 'moderation' | 'analytics' | 'live' | 'audit' | 'settings'
  >('overview');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@bluewave.video');
  const [loginPassword, setLoginPassword] = useState('Admin@BlueWave2026!');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Overview stats & metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [trafficAnalytics, setTrafficAnalytics] = useState<any>(null);
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30d');
  const [liveVisitors, setLiveVisitors] = useState<any[]>([]);

  // CRUD datasets
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const [adModalOpen, setAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Partial<Advertisement> | null>(null);

  const [videoSearch, setVideoSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Fetch Admin Data
  const loadAdminData = useCallback(async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [mRes, vRes, cRes, aRes, rRes, audRes] = await Promise.all([
        fetch('/api/admin/metrics/overview', { headers }).then((r) => r.json()),
        fetch('/api/admin/videos?limit=100', { headers }).then((r) => r.json()),
        fetch('/api/admin/categories', { headers }).then((r) => r.json()),
        fetch('/api/admin/ads', { headers }).then((r) => r.json()),
        fetch('/api/admin/reports', { headers }).then((r) => r.json()),
        fetch('/api/admin/audit-logs', { headers }).then((r) => r.json()),
      ]);

      setMetrics(mRes);
      setVideos(vRes.videos || []);
      setCategories(cRes || []);
      setAds(aRes || []);
      setReports(rRes || []);
      setAuditLogs(audRes || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, [token]);

  // Fetch Traffic Analytics on date range change
  const loadTrafficAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/analytics/traffic?range=${analyticsDateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrafficAnalytics(data);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  }, [token, analyticsDateRange]);

  // Fetch Real-Time Live Visitors stream
  const loadLiveVisitors = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/analytics/realtime', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLiveVisitors(data.activeVisitors || []);
      }
    } catch (err) {
      console.error('Live stream error:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadAdminData();
      loadTrafficAnalytics();
      loadLiveVisitors();
    }
  }, [token, loadAdminData, loadTrafficAnalytics, loadLiveVisitors]);

  // Poll live visitors if tab is live or overview
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      loadLiveVisitors();
    }, 6000);
    return () => clearInterval(interval);
  }, [token, loadLiveVisitors]);

  // Handle Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);

    const res = await login(loginEmail.trim(), loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Invalid administrator credentials.');
    } else {
      showToast('Welcome to Porn Gabar Control Panel', 'success');
    }
    setLoginSubmitting(false);
  };

  // Video Actions
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    try {
      const isEdit = !!editingVideo.id;
      const url = isEdit ? `/api/admin/videos/${editingVideo.id}` : '/api/admin/videos';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingVideo),
      });

      if (res.ok) {
        showToast(isEdit ? 'Video updated successfully' : 'Video published successfully', 'success');
        setVideoModalOpen(false);
        setEditingVideo(null);
        loadAdminData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save video', 'error');
      }
    } catch {
      showToast('Network error saving video', 'error');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Video deleted successfully', 'success');
        loadAdminData();
      }
    } catch {
      showToast('Failed to delete video', 'error');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const isEdit = !!editingCategory.id;
      const url = isEdit ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingCategory),
      });

      if (res.ok) {
        showToast('Category saved', 'success');
        setCategoryModalOpen(false);
        setEditingCategory(null);
        loadAdminData();
      }
    } catch {
      showToast('Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category channel?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Category deleted successfully', 'success');
        loadAdminData();
      }
    } catch {
      showToast('Failed to delete category', 'error');
    }
  };

  const handleToggleCategoryStatus = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (res.ok) {
        showToast(`Category ${!cat.isActive ? 'enabled' : 'disabled'}`, 'success');
        loadAdminData();
      }
    } catch {
      showToast('Failed to update category status', 'error');
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(targetIndex, 0, moved);

    const orderedIds = newCategories.map((c) => c.id);

    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryIds: orderedIds }),
      });

      if (res.ok) {
        showToast('Category order saved', 'success');
        loadAdminData();
      }
    } catch {
      showToast('Failed to reorder categories', 'error');
    }
  };

  // Advertisement Actions
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    try {
      const isEdit = !!editingAd.id;
      const url = isEdit ? `/api/admin/ads/${editingAd.id}` : '/api/admin/ads';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingAd),
      });

      if (res.ok) {
        showToast('Advertisement saved', 'success');
        setAdModalOpen(false);
        setEditingAd(null);
        loadAdminData();
      }
    } catch {
      showToast('Failed to save advertisement', 'error');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement unit?')) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Advertisement campaign deleted', 'success');
        loadAdminData();
      }
    } catch {
      showToast('Failed to delete advertisement', 'error');
    }
  };

  const handleToggleAdStatus = async (ad: Advertisement) => {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      if (res.ok) {
        showToast(`Ad ${!ad.isActive ? 'activated' : 'paused'}`, 'success');
        loadAdminData();
      }
    } catch {
      showToast('Failed to toggle ad status', 'error');
    }
  };

  const handleReportAction = async (id: string, action: 'resolve' | 'dismiss') => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: action === 'resolve' ? 'resolved' : 'dismissed' }),
      });
      if (res.ok) {
        showToast(`Report ${action}d`, 'success');
        loadAdminData();
      }
    } catch {
      showToast('Action failed', 'error');
    }
  };

  // 1. Unauthenticated Login Gate
  if (!admin || !token) {
    return (
      <div id="admin-login-gate" className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-blue-100 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0B3DCC] to-[#1769FF] text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Porn Gabar Admin Portal</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Restricted management area. Authenticate with your administrative credentials.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800 text-red-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3 rounded-xl bg-[#1769FF] text-white text-sm font-bold hover:bg-[#0B3DCC] shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all"
            >
              {loginSubmitting ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button onClick={onExit} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
              ← Return to Public Site
            </button>
            <span className="text-gray-400 dark:text-slate-500 text-[11px]">Demo: Admin@BlueWave2026!</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard Layout
  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
      v.category.toLowerCase().includes(videoSearch.toLowerCase())
  );

  return (
    <div id="admin-management-panel" className="pb-24 space-y-8">
      
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0B3DCC] to-[#1769FF] text-white flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Porn Gabar Administration Engine</h1>
              <span className="text-[10px] font-bold text-[#1769FF] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900">
                {admin.role.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Connected: {admin.email} • {liveVisitors.length} live visitors active</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadAdminData();
              loadTrafficAnalytics();
              loadLiveVisitors();
              showToast('Data refreshed', 'info');
            }}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-[#1769FF] dark:hover:text-blue-400 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onExit}
            className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-slate-700 text-xs font-bold text-[#1769FF] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          >
            View Public Site
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
            {[
              { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
              { id: 'videos', label: 'Video Management', icon: Film, count: videos.length },
              { id: 'categories', label: 'Categories', icon: Grid, count: categories.length },
              { id: 'ads', label: 'Advertisements', icon: Megaphone, count: ads.length },
              { id: 'moderation', label: 'Moderation Reports', icon: Flag, count: reports.filter((r) => r.status === 'pending').length, alert: true },
              { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
              { id: 'live', label: 'Real-Time Monitor', icon: Radio, pulse: true },
              { id: 'audit', label: 'Audit Security Logs', icon: History },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-tab-${item.id}`}
                  onClick={() => setTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1769FF] text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 hover:text-[#1769FF] dark:hover:text-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.pulse ? 'text-emerald-400 animate-pulse' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.alert
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                          : 'bg-blue-50 dark:bg-blue-950/80 text-[#1769FF] dark:text-blue-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && metrics && (
            <div className="space-y-6">
              
              {/* KPI Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400 dark:text-slate-400 text-xs font-medium">
                    <span>Total Streams</span>
                    <Film className="w-4 h-4 text-[#1769FF] dark:text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">{metrics.totalViews?.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+14.2% this week</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400 dark:text-slate-400 text-xs font-medium">
                    <span>Active Catalog</span>
                    <Grid className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">{metrics.publishedVideos} Videos</div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-500">across {categories.length} categories</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400 dark:text-slate-400 text-xs font-medium">
                    <span>Ad Impressions</span>
                    <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">{metrics.totalAdImpressions?.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{metrics.averageCTR}% CTR</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400 dark:text-slate-400 text-xs font-medium">
                    <span>Registered Viewers</span>
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">{metrics.totalUsers?.toLocaleString()}</div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">100% verified</div>
                </div>
              </div>

              {/* Quick Actions & Top Performing Rail */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Performing Master Titles</h3>
                  <button onClick={() => setTab('videos')} className="text-xs font-bold text-[#1769FF] dark:text-blue-400">
                    Manage All Videos
                  </button>
                </div>

                <div className="space-y-3">
                  {metrics.topVideos?.map((v: Video) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F8FF]/80 dark:bg-slate-800/80 border border-blue-50 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <img src={v.thumbnailUrl} alt={v.title} className="w-14 h-9 object-cover rounded-lg" />
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{v.title}</h4>
                          <span className="text-[10px] text-[#1769FF] dark:text-blue-400 font-semibold">{v.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-gray-900 dark:text-white">{v.views.toLocaleString()} views</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-400">{v.likes} likes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: VIDEOS CRUD */}
          {tab === 'videos' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Video Content Master List</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Publish, schedule, edit metadata, or tag videos</p>
                </div>
                <button
                  id="admin-add-video-btn"
                  onClick={() => {
                    setEditingVideo({
                      title: '',
                      description: '',
                      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
                      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                      duration: 300,
                      durationFormatted: '05:00',
                      category: categories[0]?.name || 'အပြာစာအုပ်',
                      categoryId: categories[0]?.id || 'cat-erotic-books',
                      isPublished: true,
                      featured: false,
                      isPremium: false,
                      contentOwner: 'Porn Gabar Master Creator',
                      licenseInfo: 'Standard Broadcast Rights',
                      tags: ['cinema', '4k'],
                    });
                    setVideoModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Video</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter videos by title or category..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Video Title</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Views</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Premium</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/80">
                    {filteredVideos.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={v.thumbnailUrl} alt={v.title} className="w-12 h-8 rounded object-cover" />
                            <div>
                              <div className="font-bold text-gray-900 dark:text-slate-100 line-clamp-1 max-w-xs">{v.title}</div>
                              <div className="text-[10px] text-gray-400 dark:text-slate-400">{v.durationFormatted}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-gray-700 dark:text-slate-300">{v.category}</td>
                        <td className="py-3 font-bold text-gray-900 dark:text-slate-100">{v.views.toLocaleString()}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.isPublished
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {v.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3">
                          {v.isPremium ? (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                              <Crown className="w-3 h-3" />
                              <span>4K Pro</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-slate-400">Free</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingVideo(v);
                                setVideoModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Edit Video"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(v.id)}
                              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES CRUD */}
          {tab === 'categories' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Category Channels</h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 font-bold text-[11px]">
                      {categories.length} total
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Add, edit, delete, enable/disable, and reorder video category channels
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="pl-8 pr-3 py-2 bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1769FF] w-48"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingCategory({
                        name: '',
                        slug: '',
                        description: '',
                        iconName: 'Film',
                        color: '#1769FF',
                        isActive: true,
                        order: categories.length + 1,
                      });
                      setCategoryModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] shadow-sm transition-all whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 w-16 text-center">Order</th>
                      <th className="pb-3">Category Name & Details</th>
                      <th className="pb-3">Slug</th>
                      <th className="pb-3">Videos</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/80">
                    {categories
                      .filter(
                        (c) =>
                          !categorySearch ||
                          c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                          c.slug.toLowerCase().includes(categorySearch.toLowerCase()) ||
                          (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase()))
                      )
                      .map((c, idx) => (
                      <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              disabled={idx === 0 || !!categorySearch}
                              onClick={() => handleMoveCategory(idx, 'up')}
                              className="p-1 rounded text-gray-400 hover:text-[#1769FF] disabled:opacity-20 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === categories.length - 1 || !!categorySearch}
                              onClick={() => handleMoveCategory(idx, 'down')}
                              className="p-1 rounded text-gray-400 hover:text-[#1769FF] disabled:opacity-20 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: c.color || '#1769FF' }}
                            >
                              <Film className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-slate-100">{c.name}</span>
                              {c.description && (
                                <p className="text-[11px] text-gray-400 dark:text-slate-400 line-clamp-1">{c.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-gray-500 dark:text-slate-400">/{c.slug}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 font-bold text-[10px]">
                            {c.videoCount || 0} videos
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleCategoryStatus(c)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                              c.isActive !== false
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {c.isActive !== false ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            <span>{c.isActive !== false ? 'Enabled' : 'Disabled'}</span>
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory(c);
                                setCategoryModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Edit Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ADVERTISEMENTS & EXOCLICK NETWORK */}
          {tab === 'ads' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span>Advertising & Sponsorship Management</span>
                    <span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {ads.length} Active Slots
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Manage ExoClick HTML ad codes, direct banner placements, sizes (728x90, 300x250, etc.), impressions, and CTR.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingAd({
                        name: 'ExoClick 728x90 Header Ad',
                        title: 'ExoClick Publisher Network',
                        tagline: 'High CPM worldwide digital ad network',
                        bannerImage: 'https://www.exoclick.com/banners/728x90.gif',
                        targetUrl: 'https://www.exoclick.com/signup/?login=aungkolatt',
                        placement: 'top_banner',
                        adType: 'html_code',
                        adSize: '728x90',
                        codeSnippet: '<a href="https://www.exoclick.com/signup/?login=aungkolatt" target="_blank" rel="noopener noreferrer"><img src="https://www.exoclick.com/banners/728x90.gif" border="0" alt="ExoClick"></a>',
                        mobileEnabled: true,
                        desktopEnabled: true,
                        isActive: true,
                        priority: 10,
                      });
                      setAdModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Ad Code</span>
                  </button>
                </div>
              </div>

              {/* 16 ExoClick Quick Preset Buttons */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-slate-800/80 dark:to-blue-950/30 border border-blue-100/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#1769FF] dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">ExoClick Quick Preset Injector (16 Sizes)</span>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">Click any preset to create or edit instantly</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {EXOCLICK_PRESETS.map((preset) => (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => {
                        setEditingAd({
                          name: preset.name,
                          title: preset.name,
                          tagline: preset.description,
                          bannerImage: preset.bannerImage,
                          targetUrl: preset.targetUrl,
                          placement: preset.placement,
                          adType: 'html_code',
                          adSize: preset.size,
                          codeSnippet: preset.codeSnippet,
                          mobileEnabled: true,
                          desktopEnabled: true,
                          isActive: true,
                          priority: 10,
                        });
                        setAdModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#1769FF] dark:hover:border-blue-500 hover:shadow-xs transition-all text-center group"
                    >
                      <div className="text-[11px] font-black text-gray-900 dark:text-white group-hover:text-[#1769FF] dark:group-hover:text-blue-400">{preset.size}</div>
                      <div className="text-[9px] text-gray-400 dark:text-slate-400 capitalize truncate mt-0.5">{preset.placement.replace('_', ' ')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advertisements List */}
              <div className="space-y-4">
                {ads.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
                  return (
                    <div
                      key={ad.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center p-1">
                          <img
                            src={ad.bannerImage}
                            alt={ad.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{ad.name}</h4>
                            <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 px-2 py-0.5 rounded">
                              {ad.placement}
                            </span>
                            {ad.adSize && (
                              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                                {ad.adSize}
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleAdStatus(ad)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                                ad.isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                              }`}
                            >
                              {ad.isActive ? '● Live' : '○ Paused'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{ad.tagline || ad.title || 'No tagline configured'}</p>
                          {ad.codeSnippet && (
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded max-w-md truncate">
                              {ad.codeSnippet}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full lg:w-auto gap-6 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left lg:text-right text-xs">
                          <div className="font-black text-gray-900 dark:text-white">{ad.impressions.toLocaleString()} views</div>
                          <div className="text-[11px] text-[#1769FF] dark:text-blue-400 font-semibold">
                            {ad.clicks} clicks ({ctr}% CTR)
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingAd(ad);
                              setAdModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:text-[#1769FF] dark:hover:text-blue-400 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 transition-colors"
                            title="Edit ad code"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete ad unit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: MODERATION REPORTS */}
          {tab === 'moderation' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Content Moderation & Compliance Queue</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Review copyright claims and viewer flags</p>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 dark:text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No reports currently pending moderation. Clean compliance queue!
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                            {r.reason}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">Report on Video ID: {r.videoId}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl">{r.notes}</p>
                      {r.status === 'pending' && (
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleReportAction(r.id, 'dismiss')}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                          >
                            Dismiss Flag
                          </button>
                          <button
                            onClick={() => handleReportAction(r.id, 'resolve')}
                            className="px-3 py-1.5 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC]"
                          >
                            Take Moderation Action
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TRAFFIC ANALYTICS */}
          {tab === 'analytics' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Traffic & Engagement Analytics</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Live server beacon tracking, UTM campaigns, and platform breakdowns</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#F5F8FF] dark:bg-slate-800 p-1 rounded-xl">
                  {['today', '7d', '30d', '90d'].map((rng) => (
                    <button
                      key={rng}
                      onClick={() => setAnalyticsDateRange(rng)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        analyticsDateRange === rng ? 'bg-[#1769FF] text-white shadow' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {rng.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {trafficAnalytics && (
                <div className="space-y-6">
                  {/* Visitor summary metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Total Pageviews</span>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
                        {trafficAnalytics.summary?.totalPageviews?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Unique Visitors</span>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
                        {trafficAnalytics.summary?.uniqueVisitors?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Avg Duration</span>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-1">4m 12s</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Bounce Rate</span>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-1">28.4%</div>
                    </div>
                  </div>

                  {/* Device & Browser Breakdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">Device Breakdown</h4>
                      <div className="space-y-2 text-xs">
                        {trafficAnalytics.breakdowns?.device?.map((d: any) => (
                          <div key={d.name} className="flex items-center justify-between">
                            <span className="capitalize font-semibold text-gray-700 dark:text-slate-300">{d.name}</span>
                            <span className="font-bold text-[#1769FF] dark:text-blue-400">{d.count} ({d.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">Top Traffic Sources</h4>
                      <div className="space-y-2 text-xs">
                        {trafficAnalytics.breakdowns?.source?.map((s: any) => (
                          <div key={s.name} className="flex items-center justify-between">
                            <span className="capitalize font-semibold text-gray-700 dark:text-slate-300">{s.name}</span>
                            <span className="font-bold text-[#1769FF] dark:text-blue-400">{s.count} ({s.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: REAL TIME MONITOR */}
          {tab === 'live' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Live Concurrent Viewers Stream</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Real-time session heartbeats active in the last 60 seconds</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
                  {liveVisitors.length} Active Now
                </span>
              </div>

              <div className="space-y-2">
                {liveVisitors.length === 0 ? (
                  <p className="text-center py-8 text-xs text-gray-400 dark:text-slate-500">Waiting for live visitor beacons...</p>
                ) : (
                  liveVisitors.map((vis, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F8FF] dark:bg-slate-800/80 border border-blue-50 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-gray-400 dark:text-slate-500">{vis.sessionId.slice(0, 10)}...</span>
                        <span className="font-bold text-gray-800 dark:text-slate-200">{vis.path}</span>
                      </div>
                      <span className="text-gray-400 dark:text-slate-500 font-mono text-[10px]">Just now</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {tab === 'audit' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Security & Operational Audit Trail</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Immutable chronological record of administrative actions</p>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[#F5F8FF] dark:bg-slate-800/80 border border-blue-50 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100">{log.action}</span>
                      <span className="text-gray-500 dark:text-slate-400 ml-2 font-mono text-[11px]">{log.adminEmail}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Video Modal Form */}
      {videoModalOpen && editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {editingVideo.id ? 'Edit Video Metadata' : 'Publish New Master Video'}
            </h3>

            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={editingVideo.description}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-3 text-xs text-gray-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={editingVideo.category}
                    onChange={(e) => {
                      const matched = categories.find((c) => c.name === e.target.value);
                      setEditingVideo({
                        ...editingVideo,
                        category: e.target.value,
                        categoryId: matched?.id || 'cat-nature',
                      });
                    }}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Duration (mm:ss)</label>
                  <input
                    type="text"
                    value={editingVideo.durationFormatted}
                    onChange={(e) => setEditingVideo({ ...editingVideo, durationFormatted: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  required
                  value={editingVideo.thumbnailUrl}
                  onChange={(e) => setEditingVideo({ ...editingVideo, thumbnailUrl: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Video Stream MP4 URL</label>
                <input
                  type="url"
                  required
                  value={editingVideo.videoUrl}
                  onChange={(e) => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Content Creator / Studio</label>
                  <input
                    type="text"
                    value={editingVideo.contentOwner || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, contentOwner: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">License Rights</label>
                  <input
                    type="text"
                    value={editingVideo.licenseInfo || 'Standard Broadcast'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, licenseInfo: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={editingVideo.isPremium}
                    onChange={(e) => setEditingVideo({ ...editingVideo, isPremium: e.target.checked })}
                    className="rounded text-[#1769FF]"
                  />
                  <span className="font-bold">👑 Porn Gabar Original (4K HDR)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={editingVideo.featured}
                    onChange={(e) => setEditingVideo({ ...editingVideo, featured: e.target.checked })}
                    className="rounded text-[#1769FF]"
                  />
                  <span className="font-bold">⭐ Hero Featured</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#1769FF] text-white font-bold hover:bg-[#0B3DCC]"
                >
                  Save Master Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal Form */}
      {categoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {editingCategory.id ? 'Edit Category' : 'New Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. မြန်မာ အပြာကားများ"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    name: e.target.value,
                    slug: editingCategory.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. myanmar-adult-videos"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value.toLowerCase() })}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Description for this category..."
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-3 text-xs text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">Channel Badge Color</label>
                <div className="flex items-center gap-2">
                  {['#1769FF', '#E11D48', '#059669', '#D97706', '#7C3AED', '#0891B2', '#4F46E5', '#EA580C'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, color })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        (editingCategory.color || '#1769FF') === color ? 'scale-110 ring-2 ring-offset-2 ring-[#1769FF]' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={editingCategory.isActive !== false}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                    className="rounded text-[#1769FF]"
                  />
                  <span className="font-bold text-xs">Active & Visible to Public Users</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#1769FF] text-white font-bold hover:bg-[#0B3DCC]"
                >
                  Save Category Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ad Modal Form with HTML Code Snippet Editor & ExoClick Presets */}
      {adModalOpen && editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {editingAd.id ? 'Edit Advertisement & Code' : 'Create Advertising Campaign'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Configure ExoClick ad tags, raw HTML/image codes, banner dimensions, and targeting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Selector within Modal */}
            <div className="p-3 bg-[#F5F8FF] dark:bg-slate-800/80 rounded-2xl border border-blue-100 dark:border-slate-700">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400 mb-1.5">
                Load Standard ExoClick Preset (16 Sizes)
              </label>
              <select
                onChange={(e) => {
                  const selected = EXOCLICK_PRESETS.find((p) => p.size === e.target.value);
                  if (selected) {
                    setEditingAd({
                      ...editingAd,
                      name: selected.name,
                      title: selected.name,
                      tagline: selected.description,
                      bannerImage: selected.bannerImage,
                      targetUrl: selected.targetUrl,
                      placement: selected.placement,
                      adSize: selected.size,
                      adType: 'html_code',
                      codeSnippet: selected.codeSnippet,
                    });
                  }
                }}
                className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-slate-100 font-medium"
                defaultValue=""
              >
                <option value="" disabled>
                  -- Select ExoClick banner format / size --
                </option>
                {EXOCLICK_PRESETS.map((p) => (
                  <option key={p.size} value={p.size}>
                    {p.size} ({p.name}) - {p.placement}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Campaign / Sponsor Name</label>
                  <input
                    type="text"
                    required
                    value={editingAd.name || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, name: e.target.value })}
                    placeholder="e.g. ExoClick 728x90 Header"
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Ad Dimension / Size</label>
                  <input
                    type="text"
                    value={editingAd.adSize || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, adSize: e.target.value })}
                    placeholder="e.g. 728x90, 300x250, 160x600"
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Placement Slot</label>
                  <select
                    value={editingAd.placement || 'top_banner'}
                    onChange={(e) => setEditingAd({ ...editingAd, placement: e.target.value as any })}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-slate-100"
                  >
                    <option value="top_banner">Top Banner (Header Leaderboard)</option>
                    <option value="home_feed">Home Feed Sponsored Card</option>
                    <option value="sidebar">Sidebar Unit (Watch Page & Categories)</option>
                    <option value="before_video">Pre-Roll Video Ad</option>
                    <option value="bottom_banner">Bottom Banner (Footer / Content End)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Ad Type</label>
                  <select
                    value={editingAd.adType || 'html_code'}
                    onChange={(e) => setEditingAd({ ...editingAd, adType: e.target.value as any })}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-slate-100"
                  >
                    <option value="html_code">Raw HTML Code Snippet / ExoClick Tag</option>
                    <option value="banner">Native Card Banner</option>
                    <option value="sponsored_card">Sponsored Video Card</option>
                  </select>
                </div>
              </div>

              {/* Raw HTML Code Snippet Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#1769FF]" />
                    <span>Ad Code Snippet / ExoClick HTML Tag</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Paste your &lt;a href...&gt;&lt;img...&gt;&lt;/a&gt; or script tag</span>
                </div>
                <textarea
                  rows={3}
                  value={editingAd.codeSnippet || ''}
                  onChange={(e) => {
                    const snippet = e.target.value;
                    let imgUrl = editingAd.bannerImage;
                    let targetUrl = editingAd.targetUrl;

                    // Auto-parse image URL and target URL from HTML code snippet
                    const imgMatch = snippet.match(/src=["']([^"']+)["']/i);
                    const hrefMatch = snippet.match(/href=["']([^"']+)["']/i);
                    if (imgMatch && imgMatch[1]) imgUrl = imgMatch[1];
                    if (hrefMatch && hrefMatch[1]) targetUrl = hrefMatch[1];

                    setEditingAd({
                      ...editingAd,
                      codeSnippet: snippet,
                      bannerImage: imgUrl,
                      targetUrl: targetUrl,
                      adType: 'html_code',
                    });
                  }}
                  placeholder='<a href="https://www.exoclick.com/signup/?login=aungkolatt"><img src="https://www.exoclick.com/banners/728x90.gif" border="0"></a>'
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-3 font-mono text-[11px] text-gray-900 dark:text-slate-100 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Banner Image URL / GIF Source</label>
                  <input
                    type="url"
                    required
                    value={editingAd.bannerImage || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, bannerImage: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">Destination Target URL</label>
                  <input
                    type="url"
                    required
                    value={editingAd.targetUrl || ''}
                    onChange={(e) => setEditingAd({ ...editingAd, targetUrl: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              {editingAd.bannerImage && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Live Ad Preview</span>
                  <div className="flex items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <img
                      src={editingAd.bannerImage}
                      alt={editingAd.name || 'Ad preview'}
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={editingAd.isActive !== false}
                      onChange={(e) => setEditingAd({ ...editingAd, isActive: e.target.checked })}
                      className="rounded text-[#1769FF]"
                    />
                    <span className="font-bold text-xs">Campaign Active</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={editingAd.mobileEnabled !== false}
                      onChange={(e) => setEditingAd({ ...editingAd, mobileEnabled: e.target.checked })}
                      className="rounded text-[#1769FF]"
                    />
                    <span className="font-bold text-xs">Mobile</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={editingAd.desktopEnabled !== false}
                      onChange={(e) => setEditingAd({ ...editingAd, desktopEnabled: e.target.checked })}
                      className="rounded text-[#1769FF]"
                    />
                    <span className="font-bold text-xs">Desktop</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-[#1769FF] text-white font-bold hover:bg-[#0B3DCC] shadow-sm transition-all"
                  >
                    Save Advertisement
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
