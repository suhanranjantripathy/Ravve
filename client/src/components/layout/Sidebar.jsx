import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, Compass, BookMarked, BookOpen, Users, Trophy, BarChart3, 
  PenTool, Bell, Settings, Scale, Bookmark, Sparkles, ChevronRight 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export default function Sidebar() {
  const { user } = useAuthStore();
  const [goalSummary, setGoalSummary] = useState(null);

  useEffect(() => {
    loadGoalMini();
  }, [user?.id]);

  const loadGoalMini = async () => {
    try {
      const res = await api.getReadingGoal();
      if (res.currentGoal) {
        setGoalSummary(res.currentGoal);
      }
    } catch (_) {}
  };

  const navItems = [
    { label: 'Home Dashboard', path: '/dashboard', icon: Home },
    { label: 'Discover Books', path: '/discover', icon: Compass },
    { label: 'My Bookshelves', path: '/shelves', icon: BookMarked },
    { label: 'Currently Reading', path: '/currently-reading', icon: BookOpen },
    { label: 'Book Comparison', path: '/compare', icon: Scale },
    { label: 'Community Feed', path: '/community', icon: Users },
    { label: 'Reading Challenges', path: '/challenges', icon: Trophy },
    { label: 'Reading Statistics', path: '/statistics', icon: BarChart3 },
    { label: 'Reading Journal', path: '/journal', icon: PenTool },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-parchment dark:bg-stone-900/60 border-r border-warm-200 dark:border-stone-800 min-h-screen p-4 transition-colors">
      
      {/* Brand Header */}
      <div className="px-3 py-4 mb-3">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-forest-800 text-cream flex items-center justify-center font-serif font-black text-xl shadow-book group-hover:scale-105 transition-transform">
            R
          </div>
          <div>
            <span className="font-serif font-black tracking-wider text-2xl text-forest-800 dark:text-warm-100 block leading-tight">
              RAAVE
            </span>
            <span className="text-[11px] font-sans tracking-wide text-warm-500 dark:text-stone-400 block -mt-0.5">
              Reading Community
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-forest-800 text-cream font-semibold shadow-sm dark:bg-emerald-900/60 dark:text-emerald-200'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-warm-200/60 dark:hover:bg-stone-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Reading Challenge Mini Progress Card */}
      {goalSummary && (
        <div className="mt-auto pt-4 border-t border-warm-200 dark:border-stone-800">
          <Link
            to="/challenges"
            className="block p-3.5 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-warm-200 dark:border-stone-700/60 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 font-serif">
                <Trophy className="w-3.5 h-3.5 text-amberGold" />
                {goalSummary.year} Reading Goal
              </span>
              <span className="text-[11px] font-bold text-forest-700 dark:text-emerald-400">
                {goalSummary.percentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-warm-200 dark:bg-stone-700 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-forest-700 dark:bg-emerald-500 transition-all duration-500"
                style={{ width: `${goalSummary.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
              <span>{goalSummary.completed_books} of {goalSummary.target_books} books</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      )}

      {/* Active User Card at Bottom */}
      {user && (
        <Link
          to={`/profile/${user.username}`}
          className="flex items-center gap-3 p-2.5 mt-3 rounded-xl hover:bg-warm-200/60 dark:hover:bg-stone-800/60 transition-colors"
        >
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
            alt=""
            className="w-8 h-8 rounded-full object-cover ring-1 ring-warm-300 dark:ring-stone-700"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">{user.full_name}</div>
            <div className="text-[10px] text-stone-400 truncate">@{user.username}</div>
          </div>
        </Link>
      )}

    </aside>
  );
}
