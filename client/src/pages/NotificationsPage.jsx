import React, { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, User, Heart, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-warm-200 dark:border-stone-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
            Inbox
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
            Notifications ({unreadCount} unread)
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 border border-warm-300 dark:border-stone-700 hover:bg-warm-100 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-warm-200 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
          <Bell className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-60" />
          <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">All caught up</h3>
          <p className="text-xs text-stone-400 mt-1">When readers follow you or react to your reviews, you'll see alerts here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                !n.is_read
                  ? 'bg-forest-50/50 dark:bg-forest-950/30 border-forest-200 dark:border-forest-900 shadow-sm'
                  : 'bg-white dark:bg-stone-900 border-warm-200 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {n.actor_avatar ? (
                  <img src={n.actor_avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-forest-800/10 text-forest-800 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amberGold" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-snug">
                    {n.actor_name && <strong className="font-semibold">{n.actor_name} </strong>}
                    {n.message}
                  </p>
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <div className="w-2.5 h-2.5 rounded-full bg-forest-700 dark:bg-emerald-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
