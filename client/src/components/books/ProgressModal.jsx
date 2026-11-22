import React, { useState } from 'react';
import { X, BookOpen, CheckCircle, Flame, Calendar, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';

export default function ProgressModal({ book, isOpen, onClose, onUpdated }) {
  if (!isOpen || !book) return null;

  const totalPages = book.total_pages || book.book_pages || book.page_count || 320;
  const [currentPage, setCurrentPage] = useState(book.current_page || 0);
  const [personalNotes, setPersonalNotes] = useState(book.personal_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const percentage = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  const handleQuickAdd = (pagesToAdd) => {
    setCurrentPage((prev) => Math.min(totalPages, prev + pagesToAdd));
  };

  const handleSave = async (markAsFinished = false) => {
    setIsSubmitting(true);
    const targetPage = markAsFinished ? totalPages : currentPage;

    try {
      const res = await api.updateReadingProgress(book.book_id || book.id, {
        current_page: targetPage,
        total_pages: totalPages,
        personal_notes: personalNotes,
        shelf_type: (targetPage >= totalPages || markAsFinished) ? 'read' : 'currently_reading'
      });

      if (targetPage >= totalPages || markAsFinished) {
        // Celebrate with confetti!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (onUpdated) onUpdated(res.book);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-warm-200 dark:border-stone-800 shadow-2xl p-6 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Book Info */}
        <div className="flex gap-4 items-center mb-6">
          <img
            src={book.cover_url}
            alt=""
            className="w-16 h-24 object-cover rounded-xl shadow-book shrink-0"
          />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
              Reading Tracker
            </span>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 line-clamp-1">
              {book.title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">{book.author}</p>
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="p-4 rounded-2xl bg-warm-100/70 dark:bg-stone-800/60 mb-6">
          <div className="flex items-center justify-between text-sm font-semibold mb-2">
            <span className="text-stone-800 dark:text-stone-200">
              Page {currentPage} of {totalPages}
            </span>
            <span className="font-serif font-bold text-forest-800 dark:text-emerald-400 text-base">
              {percentage}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-warm-200 dark:bg-stone-700 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-forest-700 dark:bg-emerald-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Quick Page Jump Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400 mr-1">Quick Add:</span>
            <button
              onClick={() => handleQuickAdd(10)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-warm-200 dark:border-stone-600 font-medium hover:bg-warm-200 transition-colors"
            >
              +10 pages
            </button>
            <button
              onClick={() => handleQuickAdd(25)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-warm-200 dark:border-stone-600 font-medium hover:bg-warm-200 transition-colors"
            >
              +25 pages
            </button>
            <button
              onClick={() => handleQuickAdd(50)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-warm-200 dark:border-stone-600 font-medium hover:bg-warm-200 transition-colors"
            >
              +50 pages
            </button>
          </div>
        </div>

        {/* Slider Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
            Adjust Current Page:
          </label>
          <input
            type="range"
            min="0"
            max={totalPages}
            value={currentPage}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            className="w-full accent-forest-700 cursor-pointer"
          />
        </div>

        {/* Notes for this chapter/session */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-stone-400" />
            Reading Notes & Thoughts for Chapter:
          </label>
          <textarea
            rows="3"
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder="What resonated with you on these pages? Memorable quote or reflection..."
            className="w-full p-3 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-forest-800 dark:text-emerald-400 hover:bg-forest-50 dark:hover:bg-forest-950/40 border border-forest-800/30 flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark Finished</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Update Progress'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
