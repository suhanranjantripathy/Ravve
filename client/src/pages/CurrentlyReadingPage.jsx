import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Flame, Calendar, Clock, CheckCircle, Plus, 
  FileText, ArrowRight, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import ProgressModal from '../components/books/ProgressModal';

export default function CurrentlyReadingPage() {
  const [books, setBooks] = useState([]);
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentlyReading();
  }, []);

  const loadCurrentlyReading = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUserBooks('currently_reading');
      setBooks(res.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishQuick = async (book) => {
    try {
      const total = book.total_pages || book.book_pages || 350;
      await api.updateReadingProgress(book.book_id || book.id, {
        current_page: total,
        total_pages: total,
        shelf_type: 'read'
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      loadCurrentlyReading();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pb-4 border-b border-warm-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
          Reading Tracker Cockpit
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
          Currently Reading ({books.length})
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Update page numbers, log reading reflections, and watch your reading pace compound.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-3xl bg-warm-200 dark:bg-stone-800 animate-pulse" />
          <div className="h-64 rounded-3xl bg-warm-200 dark:bg-stone-800 animate-pulse" />
        </div>
      ) : books.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
          <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-3 opacity-50" />
          <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">
            No books in your currently reading stack
          </h3>
          <p className="text-xs text-stone-400 mt-1 mb-6">
            Head to Discover or check your Want to Read shelf to begin your next literary adventure.
          </p>
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all"
          >
            <span>Browse Recommendations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {books.map((b) => {
            const total = b.total_pages || b.book_pages || 350;
            const current = b.current_page || 0;
            const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
            const remaining = Math.max(0, total - current);

            return (
              <div
                key={b.id}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-6 items-start"
              >
                {/* Book Cover */}
                <Link to={`/book/${b.book_id || b.id}`} className="w-32 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-book book-card-3d bg-warm-100 dark:bg-stone-800">
                  <img src={b.cover_url} alt="" className="w-full h-full object-cover" />
                </Link>

                {/* Progress Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0 w-full">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
                        {b.genre || 'In Progress'}
                      </span>
                      {b.start_date && (
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Started: {b.start_date}
                        </span>
                      )}
                    </div>

                    <Link to={`/book/${b.book_id || b.id}`}>
                      <h2 className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100 hover:text-forest-700 transition-colors">
                        {b.title}
                      </h2>
                    </Link>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-4">
                      by {b.author}
                    </p>

                    {/* Progress Bar & Numerical Breakdown */}
                    <div className="p-4 rounded-2xl bg-warm-100/70 dark:bg-stone-800/60 mb-4">
                      <div className="flex items-center justify-between text-sm font-semibold mb-2">
                        <span className="text-stone-800 dark:text-stone-200">
                          {current} of {total} pages read
                        </span>
                        <span className="font-serif font-bold text-forest-800 dark:text-emerald-400 text-lg">
                          {percentage}%
                        </span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-warm-200 dark:bg-stone-700 overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full bg-forest-700 dark:bg-emerald-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>{remaining} pages remaining</span>
                        <span>Estimated finish: ~{Math.ceil(remaining / 35)} sessions</span>
                      </div>
                    </div>

                    {/* Personal Notes Preview */}
                    {b.personal_notes && (
                      <div className="p-3 rounded-xl bg-warm-50 dark:bg-stone-800/40 border border-warm-200 dark:border-stone-700/60 text-xs text-stone-700 dark:text-stone-300 mb-4 italic">
                        <FileText className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
                        "{b.personal_notes}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => handleFinishQuick(b)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Finished</span>
                    </button>

                    <button
                      onClick={() => setSelectedBookForProgress(b)}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Update Progress / Log Session</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        book={selectedBookForProgress}
        isOpen={Boolean(selectedBookForProgress)}
        onClose={() => setSelectedBookForProgress(null)}
        onUpdated={() => loadCurrentlyReading()}
      />

    </div>
  );
}
