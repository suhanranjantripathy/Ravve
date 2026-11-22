import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, Award, Crown, Compass, Calendar, Check, 
  ArrowRight, Sparkles, Edit3 
} from 'lucide-react';
import { api } from '../services/api';
import BookCard from '../components/books/BookCard';

export default function ChallengesPage() {
  const [goalData, setGoalData] = useState(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(36);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    setIsLoading(true);
    try {
      const res = await api.getReadingGoal();
      setGoalData(res);
      setNewTarget(res.currentGoal?.target_books || 36);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTarget = async (e) => {
    e.preventDefault();
    try {
      await api.updateReadingTarget(Number(newTarget));
      setIsEditingTarget(false);
      loadChallenge();
    } catch (err) {
      alert(err.message || 'Failed to update reading goal');
    }
  };

  if (isLoading || !goalData) {
    return (
      <div className="p-12 text-center animate-pulse">
        <div className="w-16 h-16 rounded-full bg-warm-200 dark:bg-stone-800 mx-auto mb-4" />
        <div className="h-6 w-48 bg-warm-200 dark:bg-stone-800 mx-auto rounded-md" />
      </div>
    );
  }

  const { currentGoal, booksCompleted, previousGoals, milestones } = goalData;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <div className="pb-4 border-b border-warm-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
          Annual Reading Challenge
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
          {currentGoal.year} Reading Challenge
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Set your annual target, celebrate milestones, and track books completed throughout the year.
        </p>
      </div>

      {/* Hero Goal Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-forest-900 to-forest-800 text-cream shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amberGold flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> Annual Reading Progress
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-cream mt-1">
              {currentGoal.completed_books} of {currentGoal.target_books} Books Read
            </h2>
            <p className="text-xs text-warm-200 mt-1">
              You are currently <strong className="text-amberGold">on schedule</strong> to complete your goal by December!
            </p>
          </div>

          {/* Goal Edit Button */}
          <div>
            {isEditingTarget ? (
              <form onSubmit={handleUpdateTarget} className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-20 px-3 py-1.5 text-xs rounded-xl bg-forest-950 border border-forest-700 text-cream"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amberGold text-stone-900 font-bold text-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTarget(false)}
                  className="text-xs text-warm-300 hover:underline"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingTarget(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-1.5 text-cream"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Adjust Target</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 rounded-full bg-forest-950/70 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-amberGold transition-all duration-700"
            style={{ width: `${currentGoal.percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-warm-200">
          <span>{currentGoal.books_remaining} books left to finish</span>
          <span className="font-bold text-sm text-cream">{currentGoal.percentage}%</span>
        </div>
      </div>

      {/* Milestone Badges Grid */}
      <section>
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-4">
          Challenge Milestones
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-center transition-all ${
                m.achieved
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 shadow-sm'
                  : 'bg-white dark:bg-stone-900 border-warm-200 dark:border-stone-800 opacity-60'
              }`}
            >
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                m.achieved ? 'bg-amberGold text-white shadow-sm' : 'bg-warm-100 dark:bg-stone-800 text-stone-400'
              }`}>
                {m.achieved ? <Trophy className="w-5 h-5" /> : <Award className="w-5 h-5" />}
              </div>
              <div className="font-bold text-xs text-stone-800 dark:text-stone-200">{m.name}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                {m.achieved ? 'Unlocked ✓' : `${m.target} Books`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Books Completed This Year */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            Books Completed in {currentGoal.year} ({booksCompleted.length})
          </h3>
          <span className="text-xs text-stone-400 font-medium">Sorted by finish date</span>
        </div>

        {booksCompleted.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No books marked as completed yet this year.</p>
            <p className="text-xs text-stone-400 mt-1">When you mark a book as read, it will automatically populate your challenge shelf.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {booksCompleted.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* Previous Years' Archive */}
      {previousGoals && previousGoals.length > 0 && (
        <section className="pt-6 border-t border-warm-200 dark:border-stone-800">
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-4">
            Previous Challenges Archive
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {previousGoals.map((pg) => (
              <div
                key={pg.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm"
              >
                <div className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-1">
                  {pg.year} Reading Challenge
                </div>
                <div className="text-xs font-semibold text-forest-700 dark:text-emerald-400 mb-2">
                  Completed {pg.completed_books} of {pg.target_books} Books ({Math.round((pg.completed_books / pg.target_books) * 100)}%)
                </div>
                <div className="w-full h-2 rounded-full bg-warm-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-forest-700 dark:bg-emerald-500"
                    style={{ width: `${Math.min(100, Math.round((pg.completed_books / pg.target_books) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
