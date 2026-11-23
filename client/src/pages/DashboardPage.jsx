import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, ArrowRight, ChevronLeft, ChevronRight,
  Users, Compass, MoreHorizontal
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import ProgressModal from '../components/books/ProgressModal';

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return { label: days[i], date: d.getDate(), isToday: i === dow };
  });
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [readingGoal, setReadingGoal] = useState(null);
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [popularIdx, setPopularIdx] = useState(0);

  const weekDays = getWeekDays();

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [crRes, recsRes, actRes, goalRes] = await Promise.all([
        api.getUserBooks('currently_reading'),
        api.getRecommendations(),
        api.getCommunityFeed('following'),
        api.getReadingGoal(),
      ]);

      setCurrentlyReading(crRes.books || []);
      setRecommendations(recsRes.becauseYouRead || recsRes.hiddenGems || recsRes.trending || []);
      setRecentActivity((actRes.activities || []).slice(0, 4));
      setReadingGoal(goalRes.currentGoal);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const firstName = (user?.full_name || user?.username || 'Reader').split(' ')[0];
  const spotlight = currentlyReading[0] || null;
  const spotTotal = spotlight?.total_pages || spotlight?.book_pages || 300;
  const spotCurrent = spotlight?.current_page || 0;

  const popular = recommendations.slice(0, 8);
  const visibleCount = 4;
  const maxIdx = Math.max(0, popular.length - visibleCount);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto animate-pulse" />
          <p className="text-sm text-stone-400 font-medium">Loading your reading space…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-stone-950">
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

        {/* ── LEFT + CENTER ── */}
        <div className="space-y-10">

          {/* HERO HEADER */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-warm-500 dark:text-stone-400 mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="font-serif font-black text-4xl sm:text-5xl text-stone-900 dark:text-stone-100 leading-tight">
                Happy reading,<br />{firstName}
              </h1>
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
                {spotlight
                  ? `You're on page ${spotCurrent} of ${spotTotal} — keep the momentum going!`
                  : 'Your reading adventure awaits. Pick a book and dive in.'}
              </p>
              <Link
                to="/currently-reading"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-sm font-semibold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all"
              >
                Start reading <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Book cover hero */}
            {spotlight ? (
              <Link to={`/book/${spotlight.book_id || spotlight.id}`} className="shrink-0 hidden sm:block">
                <div
                  className="relative w-36 h-52 rounded-2xl overflow-hidden shadow-book"
                  style={{ transform: 'perspective(600px) rotateY(-8deg)' }}
                >
                  {spotlight.cover_url ? (
                    <img src={spotlight.cover_url} alt={spotlight.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-warm-200 dark:bg-stone-800">
                      <BookOpen className="w-12 h-12 text-warm-400 dark:text-stone-600" />
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="shrink-0 hidden sm:flex items-center justify-center w-36 h-52 rounded-2xl bg-warm-200 dark:bg-stone-800">
                <BookOpen className="w-14 h-14 text-warm-400 dark:text-stone-600" />
              </div>
            )}
          </div>

          {/* POPULAR NOW */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">Popular Now</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPopularIdx(i => Math.max(0, i - 1))}
                  disabled={popularIdx === 0}
                  className="w-8 h-8 rounded-full border border-warm-200 dark:border-stone-700 flex items-center justify-center hover:bg-warm-100 dark:hover:bg-stone-800 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                </button>
                <button
                  onClick={() => setPopularIdx(i => Math.min(maxIdx, i + 1))}
                  disabled={popularIdx >= maxIdx}
                  className="w-8 h-8 rounded-full border border-warm-200 dark:border-stone-700 flex items-center justify-center hover:bg-warm-100 dark:hover:bg-stone-800 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                </button>
              </div>
            </div>

            {popular.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 text-center">
                <p className="text-sm text-stone-400">No recommendations yet.</p>
                <Link to="/discover" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline">
                  <Compass className="w-3.5 h-3.5" /> Discover books
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4 overflow-hidden">
                {popular.slice(popularIdx, popularIdx + visibleCount).map((book) => (
                  <Link key={book.id} to={`/book/${book.id}`} className="group flex flex-col gap-2">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-book bg-warm-100 dark:bg-stone-800 group-hover:shadow-elevated transition-shadow">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-warm-400 dark:text-stone-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 line-clamp-2 leading-tight">
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="text-[11px] text-stone-400 line-clamp-1">{book.author}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* CURRENTLY READING LIST */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">Currently Reading</h2>
              <Link to="/currently-reading" className="text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
                <MoreHorizontal className="w-4 h-4" />
              </Link>
            </div>

            {currentlyReading.length === 0 ? (
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 text-center">
                <BookOpen className="w-7 h-7 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500 dark:text-stone-400">No books in progress. Start one!</p>
                <Link to="/discover" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline">
                  <Compass className="w-3.5 h-3.5" /> Discover books
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {currentlyReading.slice(0, 4).map((book) => {
                  const total = book.total_pages || book.book_pages || 300;
                  const current = book.current_page || 0;
                  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
                  return (
                    <div
                      key={book.id}
                      className="flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 hover:shadow-sm transition-all"
                    >
                      <Link to={`/book/${book.book_id || book.id}`} className="shrink-0 w-14 h-20 rounded-xl overflow-hidden shadow-book bg-warm-100 dark:bg-stone-800">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-warm-400 dark:text-stone-600" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/book/${book.book_id || book.id}`}>
                          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-forest-700 dark:hover:text-emerald-400 line-clamp-1">{book.title}</h3>
                        </Link>
                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{book.author}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-warm-200 dark:bg-stone-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-forest-700 dark:bg-emerald-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-forest-800 dark:text-emerald-400 shrink-0">
                            {current} / {total}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBookForProgress(book)}
                        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-cream transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-6">

          {/* Reading Progress Card */}
          {spotlight && (
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
              <Link to={`/book/${spotlight.book_id || spotlight.id}`}>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 hover:text-forest-700 dark:hover:text-emerald-400 leading-tight line-clamp-2">
                  {spotlight.title}
                </h3>
              </Link>
              <p className="text-sm font-bold mt-2 text-forest-800 dark:text-emerald-400">
                {spotCurrent} / {spotTotal} pages
              </p>
              {spotlight.description && (
                <p className="mt-3 text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-4">
                  {spotlight.description}
                </p>
              )}
              <div className="mt-4 w-full h-1.5 rounded-full bg-warm-200 dark:bg-stone-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-forest-700 dark:bg-emerald-500 transition-all"
                  style={{ width: `${spotTotal > 0 ? Math.min(100, Math.round((spotCurrent / spotTotal) * 100)) : 0}%` }}
                />
              </div>
              <button
                onClick={() => setSelectedBookForProgress(spotlight)}
                className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream transition-all"
              >
                Log Progress
              </button>
            </div>
          )}

          {/* Reading Goal Card */}
          {readingGoal && (
            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">{readingGoal.year} Reading Goal</h4>
                <Link to="/challenges" className="text-[11px] font-semibold text-forest-700 dark:text-emerald-400 hover:underline">
                  View →
                </Link>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-black font-serif text-forest-800 dark:text-emerald-400">
                  {readingGoal.completed_books}
                </span>
                <span className="text-sm text-stone-400 dark:text-stone-500 mb-0.5">/ {readingGoal.target_books} books</span>
              </div>
              <div className="w-full h-2 rounded-full bg-warm-200 dark:bg-stone-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-forest-700 dark:bg-emerald-500 transition-all"
                  style={{ width: `${readingGoal.percentage || 0}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-stone-400 dark:text-stone-500">{readingGoal.books_remaining} more books to reach your target</p>
            </div>
          )}

          {/* Schedule Reading — weekly strip */}
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">Schedule Reading</h4>
              <div className="flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(({ label, date, isToday }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500">{label}</span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isToday
                        ? 'bg-forest-800 text-cream shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-warm-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {date}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/currently-reading"
              className="mt-4 block text-center text-xs font-semibold py-2 rounded-xl bg-warm-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-warm-100 dark:hover:bg-stone-700 transition-colors"
            >
              Track today's session
            </Link>
          </div>

          {/* Reader Friends */}
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-800 dark:text-emerald-400" />
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">Reader Friends</h4>
              </div>
              <Link to="/community" className="w-5 h-5 flex items-center justify-center rounded-full bg-warm-100 dark:bg-stone-800 hover:bg-warm-200 dark:hover:bg-stone-700 transition-colors">
                <MoreHorizontal className="w-3 h-3 text-stone-500" />
              </Link>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-stone-400">You haven't followed anyone yet. Follow friends to see their reading activity here.</p>
                <Link to="/community" className="mt-2 inline-block text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline">
                  Find readers to follow →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    {act.avatar_url ? (
                      <img src={act.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-forest-800 dark:bg-stone-700 flex items-center justify-center shrink-0 text-xs font-bold text-cream">
                        {(act.full_name || act.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 leading-snug">
                        {act.full_name || act.username}
                        <span className="font-normal text-stone-400 dark:text-stone-500"> {
                          act.action_type === 'finished_reading' ? 'finished' :
                          act.action_type === 'started_reading' ? 'started reading' :
                          act.action_type === 'reviewed_book' ? 'reviewed' : 'is reading'
                        }</span>
                      </p>
                      {act.book_title && (
                        <p className="text-xs font-semibold mt-0.5 text-forest-700 dark:text-emerald-400 line-clamp-1">
                          {act.book_title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/community"
              className="mt-4 block text-center text-xs font-semibold py-2 rounded-xl bg-warm-50 dark:bg-stone-800 text-forest-700 dark:text-emerald-400 hover:bg-forest-50 dark:hover:bg-stone-700 transition-colors"
            >
              Open Community Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Reading Progress Modal */}
      <ProgressModal
        book={selectedBookForProgress}
        isOpen={Boolean(selectedBookForProgress)}
        onClose={() => setSelectedBookForProgress(null)}
        onUpdated={loadDashboardData}
      />
    </div>
  );
}
