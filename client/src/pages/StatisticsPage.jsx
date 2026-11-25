import React, { useState, useEffect } from 'react';
import { 
  BarChart3, BookOpen, Flame, Star, Trophy, Sparkles, 
  TrendingUp, Award, Clock 
} from 'lucide-react';
import { api } from '../services/api';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.getReadingStats();
      setStats(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="p-12 text-center animate-pulse">
        <div className="w-16 h-16 rounded-full bg-warm-200 dark:bg-stone-800 mx-auto mb-4" />
        <div className="h-6 w-48 bg-warm-200 dark:bg-stone-800 mx-auto rounded-md" />
      </div>
    );
  }

  const { summary, genresBreakdown, topAuthors, longestBook, shortestBook, monthlyActivity, ratingDistribution } = stats;

  const maxMonthBooks = Math.max(...monthlyActivity.map(m => m.books), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pb-4 border-b border-warm-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
          Reading Analytics
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
          Personal Reading Statistics
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Detailed metrics on reading volume, page counts, genre inclinations, and ratings.
        </p>
      </div>

      {/* Core 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-800 dark:bg-forest-950 dark:text-emerald-300 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-serif font-black text-3xl text-stone-900 dark:text-stone-100 block">
            {summary.books_read}
          </span>
          <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Books Read</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5" />
          </div>
          <span className="font-serif font-black text-3xl text-stone-900 dark:text-stone-100 block">
            {summary.reading_streak_days}
          </span>
          <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Day Streak</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-serif font-black text-3xl text-stone-900 dark:text-stone-100 block">
            {Number(summary.total_pages).toLocaleString()}
          </span>
          <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Total Pages</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amberGold/20 text-amberGold flex items-center justify-center mb-3">
            <Star className="w-5 h-5 fill-amberGold" />
          </div>
          <span className="font-serif font-black text-3xl text-stone-900 dark:text-stone-100 block">
            {summary.average_rating > 0 ? `${summary.average_rating} ★` : '—'}
          </span>
          <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Average Rating</span>
        </div>
      </div>

      {/* SECTION 2: MONTHLY READING HISTOGRAM */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              Monthly Reading Distribution ({new Date().getFullYear()})
            </h3>
            <p className="text-xs text-stone-400">Books and pages completed per calendar month</p>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="grid grid-cols-12 gap-2 sm:gap-3 items-end h-48 pt-6 pb-2 border-b border-warm-200 dark:border-stone-800">
          {monthlyActivity.map((m, idx) => {
            const heightPct = Math.round((m.books / maxMonthBooks) * 100);
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-bold text-forest-800 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  {m.books}
                </span>
                <div
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                    m.books > 0
                      ? 'bg-forest-800 dark:bg-emerald-600 group-hover:bg-amberGold'
                      : 'bg-warm-200 dark:bg-stone-800'
                  }`}
                  style={{ height: m.books > 0 ? `${Math.max(8, heightPct)}%` : '4px' }}
                  title={`${m.month}: ${m.books} books (${m.pages} pages)`}
                />
              </div>
            );
          })}
        </div>

        {/* Month Labels */}
        <div className="grid grid-cols-12 gap-2 sm:gap-3 pt-2 text-center text-[10px] font-semibold text-stone-500">
          {monthlyActivity.map((m, idx) => (
            <span key={idx}>{m.month}</span>
          ))}
        </div>
      </section>

      {/* SECTION 3: GENRES & AUTHORS DUAL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Favorite Genres Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-4">
            Favorite Genres
          </h3>
          <div className="space-y-3">
            {genresBreakdown.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">No books shelved yet.</p>
            ) : (
              genresBreakdown.map((g, idx) => {
                const maxGenreCount = Math.max(...genresBreakdown.map(i => i.count), 1);
                const pct = (g.count / maxGenreCount) * 100;
                return (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center justify-between font-semibold mb-1 text-stone-800 dark:text-stone-200">
                      <span>{g.genre || 'Other'}</span>
                      <span className="text-stone-400">{g.count} books</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-warm-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-forest-700 dark:bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most Read Authors */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-4">
            Most Read Authors
          </h3>
          <div className="space-y-3">
            {topAuthors.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">Finish a book to see your most read authors.</p>
            ) : (
              topAuthors.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-warm-50 dark:bg-stone-800/60 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block text-sm">{a.author}</span>
                    <span className="text-stone-400 text-[11px]">{a.books_read} books read</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amberGold">
                    <Star className="w-3.5 h-3.5 fill-amberGold" />
                    <span>{Number(a.avg_rating).toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* SECTION 4: LONGEST & SHORTEST BOOK SPOTLIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {longestBook && (
          <div className="flex gap-4 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm items-center">
            <img src={longestBook.cover_url} alt="" className="w-20 aspect-[2/3] object-cover rounded-xl shadow-book shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
                Longest Book Read
              </span>
              <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
                {longestBook.title}
              </h4>
              <p className="text-xs text-stone-500 mb-2">{longestBook.author}</p>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-900 dark:bg-forest-950 dark:text-emerald-300">
                {longestBook.pages} pages
              </span>
            </div>
          </div>
        )}

        {shortestBook && (
          <div className="flex gap-4 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm items-center">
            <img src={shortestBook.cover_url} alt="" className="w-20 aspect-[2/3] object-cover rounded-xl shadow-book shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Shortest Book Read
              </span>
              <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
                {shortestBook.title}
              </h4>
              <p className="text-xs text-stone-500 mb-2">{shortestBook.author}</p>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {shortestBook.pages} pages
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
