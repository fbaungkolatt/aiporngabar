import React, { useState } from 'react';
import { Search, Bookmark, User, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, payload?: any) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenSearch }) => {
  const { user, favorites, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'categories', label: 'Categories' },
    { id: 'trending', label: 'Trending' },
    { id: 'latest', label: 'Latest' },
    { id: 'popular', label: 'Popular' },
    { id: 'premium', label: 'Premium', isSpecial: true },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', { query: searchQuery.trim() });
    } else {
      onNavigate('search');
    }
  };

  return (
    <nav id="main-header" className="h-16 w-full border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-8 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md shrink-0 sticky top-0 z-40 transition-colors duration-200">
      <div className="flex items-center gap-8">
        {/* Brand Logo */}
        <button
          id="brand-logo-btn"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 focus:outline-none group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#1769FF] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1769FF]">
            Porn<span className="text-[#111827] dark:text-white">Gabar</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-slate-400">
          {navLinks.map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                id={`nav-${link.id}`}
                onClick={() => onNavigate(link.id)}
                className={`transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-[#1769FF] dark:text-blue-400 font-semibold'
                    : 'hover:text-[#1769FF] dark:hover:text-blue-400'
                } ${link.isSpecial ? 'font-semibold' : ''}`}
              >
                {link.isSpecial && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#1769FF]' : 'bg-[#1769FF]'}`} />
                )}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Actions & Search */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative group hidden sm:block">
          <input
            id="desktop-header-search-input"
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#F5F8FF] dark:bg-slate-800/80 border border-transparent dark:border-slate-700/60 rounded-full py-2 px-4 pl-10 text-sm w-44 md:w-60 focus:ring-2 focus:ring-[#1769FF] outline-none text-[#111827] dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400 dark:text-slate-500" />
        </form>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Day / Night Theme Toggle */}
        <ThemeToggle variant="icon" />

        {/* Saved Favorites Quick Icon */}
        <button
          id="header-favorites-btn"
          onClick={() => {
            if (user) {
              onNavigate('account', { tab: 'favorites' });
            } else {
              openAuthModal('login');
            }
          }}
          className="p-2 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 transition-colors relative cursor-pointer"
          title="Saved Favorites"
          aria-label="Favorites"
        >
          <Bookmark className="w-5 h-5" />
          {favorites.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#1769FF] rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Admin Portal Shortcut */}
        <button
          id="header-admin-gateway-btn"
          onClick={() => onNavigate('admin')}
          className="p-2 text-gray-400 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 hover:bg-[#F5F8FF] dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:flex cursor-pointer"
          title="Admin Portal"
        >
          <Shield className="w-5 h-5" />
        </button>

        {/* User Profile or Sign In */}
        {user ? (
          <button
            id="header-user-profile-btn"
            onClick={() => onNavigate('account')}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#F5F8FF] dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-blue-100 dark:border-slate-700 transition-all cursor-pointer"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="text-xs font-semibold text-[#111827] dark:text-slate-200 hidden sm:inline max-w-[100px] truncate">
              {user.name}
            </span>
          </button>
        ) : (
          <button
            id="header-signin-btn"
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-2 bg-[#1769FF] text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-[#0B3DCC] transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-[#F5F8FF] dark:hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-[#0F172A] border-b border-slate-100 dark:border-slate-800 p-4 shadow-xl z-50 flex flex-col gap-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === link.id
                  ? 'bg-[#F5F8FF] dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 font-semibold'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <ThemeToggle variant="button" />
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-[#1769FF]" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

