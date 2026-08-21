import React from 'react';
import { Home, Grid, Search, Bookmark, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, payload?: any) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate }) => {
  const { user, openAuthModal, favorites } = useAuth();

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'search', label: 'Search', icon: Search },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Bookmark,
      badge: favorites.length > 0 ? favorites.length : undefined,
      onClick: () => {
        if (user) {
          onNavigate('account', { tab: 'favorites' });
        } else {
          openAuthModal('login');
        }
      },
    },
    {
      id: 'account',
      label: user ? 'Account' : 'Sign In',
      icon: User,
      onClick: () => {
        if (user) {
          onNavigate('account');
        } else {
          openAuthModal('login');
        }
      },
    },
  ];

  return (
    <div id="mobile-bottom-navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.id ||
            (item.id === 'favorites' && currentView === 'account');

          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              onClick={() => (item.onClick ? item.onClick() : onNavigate(item.id))}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-[#1769FF] dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 text-[10px] font-bold text-white bg-[#1769FF] rounded-full min-w-[14px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
