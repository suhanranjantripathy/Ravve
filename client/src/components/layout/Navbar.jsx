import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Sun, Moon, BookOpen, User, LogOut, Check, Sparkles, ChevronDown 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { api } from '../../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (_) {}
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
      if (demoRef.current && !demoRef.current.contains(event.target)) setShowDemoMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-warm-50/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-warm-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo (Visible on mobile/when sidebar collapsed) */}
        <div className="flex items-center gap-3 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forest-800 text-warm-50 flex items-center justify-center font-serif font-bold text-lg shadow-sm">
              R
            </div>
            <span className="font-serif font-black tracking-wider text-xl text-forest-800 dark:text-warm-100">RAAVE</span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, ISBNs, genres..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-warm-100 dark:bg-stone-800/80 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/50 dark:focus:ring-emerald-600/50 transition-all placeholder:text-stone-400 text-stone-900 dark:text-stone-100"
            />
          </div>
        </form>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-warm-200/60 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-warm-200/60 dark:hover:bg-stone-800 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-warm-50 dark:ring-stone-900" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-warm-200 dark:border-stone-800 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-warm-100/60 dark:bg-stone-800/60 border-b border-warm-200 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-800 text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-forest-700 dark:text-emerald-400 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-warm-100 dark:divide-stone-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-400">
                      No notifications yet. When readers follow you or like your reviews, they'll show up here.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs flex gap-3 hover:bg-warm-50 dark:hover:bg-stone-800/50 transition-colors ${
                          !n.is_read ? 'bg-forest-50/40 dark:bg-forest-950/30' : ''
                        }`}
                      >
                        {n.actor_avatar ? (
                          <img src={n.actor_avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-forest-800/10 text-forest-800 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-amberGold" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-stone-800 dark:text-stone-200 leading-snug">
                            {n.actor_name && <strong className="font-semibold">{n.actor_name} </strong>}
                            {n.message}
                          </p>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  to="/notifications"
                  onClick={() => setShowNotifs(false)}
                  className="block py-2.5 text-center text-xs font-medium text-forest-700 dark:text-emerald-400 hover:bg-warm-100 dark:hover:bg-stone-800 border-t border-warm-200 dark:border-stone-800 transition-colors"
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </div>

          {/* User Profile Avatar Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-forest-700/30 transition-all"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover ring-1 ring-forest-800/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-forest-800 text-cream flex items-center justify-center font-bold text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-warm-200 dark:border-stone-800 py-2 z-50">
                <div className="px-4 py-2 border-b border-warm-100 dark:border-stone-800">
                  <div className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">{user?.full_name}</div>
                  <div className="text-xs text-stone-400 truncate">@{user?.username}</div>
                </div>

                <div className="py-1">
                  <Link
                    to={`/profile/${user?.username}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-stone-400" />
                    <span>My Public Profile</span>
                  </Link>

                  <Link
                    to="/shelves"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-stone-400" />
                    <span>My Bookshelves</span>
                  </Link>
                </div>

                <div className="border-t border-warm-100 dark:border-stone-800 pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
