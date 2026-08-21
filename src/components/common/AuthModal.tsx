import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (authModalMode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      const res = await register(name.trim(), email.trim(), password);
      if (!res.success) {
        setError(res.error || 'Registration failed.');
      }
    } else {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    }
    setLoading(false);
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0B3DCC] to-[#1769FF] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            {authModalMode === 'login' ? 'Welcome Back' : 'Create Porn Gabar Account'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {authModalMode === 'login'
              ? 'Sign in to access bookmarks, watch history & personalized recommendations.'
              : 'Join Porn Gabar to save favorites, sync progress and comment.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#F5F8FF] dark:bg-slate-800 p-1 rounded-xl mb-6 border border-slate-100 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setError('');
              openAuthModal('login');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              authModalMode === 'login'
                ? 'bg-white dark:bg-slate-700 text-[#1769FF] dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setError('');
              openAuthModal('register');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              authModalMode === 'register'
                ? 'bg-white dark:bg-slate-700 text-[#1769FF] dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
                />
                <UserIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
              />
              <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
              />
              <Lock className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#1769FF] text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-[#0B3DCC] disabled:opacity-50 transition-all mt-2"
          >
            {loading ? 'Processing...' : authModalMode === 'login' ? 'Sign In to Porn Gabar' : 'Create Account'}
          </button>
        </form>

        {/* Demo Credentials Help */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-gray-400 dark:text-slate-500">
            Demo User: <code className="text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">viewer@bluewave.video</code> / <code className="text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">User@BlueWave2026!</code>
          </p>
        </div>
      </div>
    </div>
  );
};
