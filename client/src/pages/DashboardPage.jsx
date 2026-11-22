import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Trophy, Flame, Bookmark, CheckCircle, ArrowRight, 
  Sparkles, Star, Users, MessageSquare, Plus, Compass 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import BookCard from '../components/books/BookCard';
import ProgressModal from '../components/books/ProgressModal';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [wantToRead, setWantToRead] = useState([]);
  const [recentRead, setRecentRead] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [readingGoal, setReadingGoal] = useState(null);
  const [statsSummary, setStatsSummary] = useState(null);
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [crRes, wtrRes, readRes, recsRes, actRes, goalRes, statsRes] = await Promise.all([
        api.getUserBooks('currently_reading'),
        api.getUserBooks('want_to_read'),
        api.getUserBooks('read'),
        api.getRecommendations(),
        api.getCommunityFeed('all'),
        api.getReadingGoal(),
        api.getReadingStats()
      ]);

      setCurrentlyReading(crRes.books || []);
      setWantToRead((wtrRes.books || []).slice(0, 4));
      setRecentRead((readRes.books || []).slice(0, 4));
      setRecommendations(recsRes.becauseYouRead || recsRes.hiddenGems || []);
      setRecentActivity((actRes.activities || []).slice(0, 5));
      setReadingGoal(goalRes.currentGoal);
      setStatsSummary(statsRes.summary);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShelfChange = () => {
    loadDashboardData();
  };

  const handleProgressUpdated = () => {
    loadDashboardData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Editorial Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-200 dark:border-stone-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
            Reading Dashboard
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
            Welcome, {user?.full_name || 'Reader'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {statsSummary?.reading_streak_days || 14} day reading streak • You're currently reading {currentlyReading.length} book{currentlyReading.length === 1 ? '' : 's'}.
          </p>
        </div>

        {/* Quick Streak & Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <div className="text-left">
              <span className="block font-bold text-xs">{statsSummary?.reading_streak_days || 14} Days</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">Active Streak</span>
            </div>
          </div>

          <Link
            to="/challenges"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-forest-50 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-900/50 text-forest-800 dark:text-emerald-300 hover:shadow-sm transition-all"
          >
            <Trophy className="w-4 h-4 text-amberGold" />
            <div className="text-left">
              <span className="block font-bold text-xs">{readingGoal?.completed_books || 24} / {readingGoal?.target_books || 36}</span>
              <span className="text-[10px] text-forest-600 dark:text-emerald-400">{readingGoal?.percentage || 67}% of 2026 Goal</span>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 1: CURRENTLY READING SPOTLIGHT */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-forest-800 dark:text-emerald-400" />
            <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              Currently Reading
            </h2>
          </div>
          <Link
            to="/currently-reading"
            className="text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Focused Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {currentlyReading.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 text-center">
            <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No books currently marked as reading.</p>
            <p className="text-xs text-stone-400 mt-1 mb-4">Pick a book from your Want to Read shelf or discover a new release.</p>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-forest-800 text-cream shadow-sm hover:bg-forest-900 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Discover Books</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentlyReading.map((book) => {
              const total = book.total_pages || book.book_pages || 350;
              const current = book.current_page || 0;
              const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

              return (
                <div
                  key={book.id}
                  className="flex gap-4 p-4 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm hover:shadow-elevated transition-all"
                >
                  <Link to={`/book/${book.book_id || book.id}`} className="shrink-0 w-24 aspect-[2/3] rounded-xl overflow-hidden shadow-book book-card-3d bg-warm-100">
                    <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
                        {book.genre || 'Reading Now'}
                      </span>
                      <Link to={`/book/${book.book_id || book.id}`}>
                        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-forest-700 line-clamp-1">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">{book.author}</p>
                    </div>

                    {/* Progress Bar & Page Stats */}
                    <div className="my-2">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-stone-700 dark:text-stone-300">
                          Page {current} of {total}
                        </span>
                        <span className="font-bold text-forest-800 dark:text-emerald-400">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-warm-200 dark:bg-stone-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-forest-700 dark:bg-emerald-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Update Button */}
                    <button
                      onClick={() => setSelectedBookForProgress(book)}
                      className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-cream transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Log Progress / Notes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: 2026 READING CHALLENGE HERO */}
      {readingGoal && (
        <section className="p-6 rounded-3xl bg-gradient-to-br from-forest-900 to-forest-800 text-cream shadow-elevated">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amberGold flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Annual Reading Challenge
              </span>
              <h2 className="font-serif font-black text-2xl text-cream mt-1">
                {readingGoal.year} Goal: {readingGoal.completed_books} of {readingGoal.target_books} Books Read
              </h2>
            </div>
            <Link
              to="/challenges"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-cream border border-white/20 transition-all text-center self-start sm:self-auto"
            >
              View Full Challenge →
            </Link>
          </div>

          <div className="w-full h-3 rounded-full bg-forest-950/60 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-amberGold transition-all duration-700"
              style={{ width: `${readingGoal.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-warm-200">
            <span>{readingGoal.books_remaining} books remaining to hit target</span>
            <span className="font-bold">{readingGoal.percentage}% Completed</span>
          </div>
        </section>
      )}

      {/* SECTION 3: RECOMMENDED BOOKS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amberGold" />
            <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              Recommended For You
            </h2>
          </div>
          <Link
            to="/discover"
            className="text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline"
          >
            Explore all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {recommendations.slice(0, 4).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onShelfChange={handleShelfChange}
              onTrackProgress={(b) => setSelectedBookForProgress(b)}
            />
          ))}
        </div>
      </section>

      {/* SECTION 4: WANT TO READ & RECENT ACTIVITY DUAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Want to Read Carousel/List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                Want to Read Next
              </h2>
            </div>
            <Link to="/shelves?shelf=want_to_read" className="text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline">
              View shelf ({wantToRead.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {wantToRead.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                userStatus={{ shelf_type: 'want_to_read' }}
                onShelfChange={handleShelfChange}
              />
            ))}
          </div>
        </div>

        {/* Community Activity Feed Snapshot */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-800 dark:text-emerald-400" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Friends' Activity
                </h3>
              </div>
              <Link to="/community" className="text-xs text-forest-700 dark:text-emerald-400 hover:underline">
                Feed →
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentActivity.map((act) => (
                <div key={act.id} className="text-xs pb-3 border-b border-warm-100 dark:border-stone-800 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={act.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-semibold text-stone-800 dark:text-stone-200">{act.full_name}</span>
                    <span className="text-[10px] text-stone-400">
                      {act.action_type === 'finished_reading' ? 'finished' : act.action_type === 'started_reading' ? 'started' : 'reviewed'}
                    </span>
                  </div>
                  {act.book_title && (
                    <div className="font-serif font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                      {act.book_title}
                    </div>
                  )}
                  {act.review_rating && (
                    <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                      {Array.from({ length: act.review_rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/community"
            className="mt-4 block py-2 text-center text-xs font-semibold text-forest-700 dark:text-emerald-400 bg-forest-50 dark:bg-forest-950/40 rounded-xl hover:bg-forest-100 transition-colors"
          >
            Open Community Feed
          </Link>
        </div>

      </div>

      {/* Reading Progress Modal */}
      <ProgressModal
        book={selectedBookForProgress}
        isOpen={Boolean(selectedBookForProgress)}
        onClose={() => setSelectedBookForProgress(null)}
        onUpdated={handleProgressUpdated}
      />

    </div>
  );
}
