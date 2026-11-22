import React, { useState } from 'react';
import { X, Star, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export default function ReviewModal({ book, isOpen, onClose, onReviewSubmitted, existingReview }) {
  if (!isOpen || !book) return null;

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [content, setContent] = useState(existingReview?.content || '');
  const [hasSpoilers, setHasSpoilers] = useState(Boolean(existingReview?.has_spoilers));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write your review thoughts.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.saveReview({
        book_id: book.id,
        rating,
        title: title.trim(),
        content: content.trim(),
        has_spoilers: hasSpoilers
      });

      if (onReviewSubmitted) onReviewSubmitted(res.review);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
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

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
            Community Review
          </span>
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            Review {book.title}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">by {book.author}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Your Star Rating:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300 dark:text-stone-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-stone-600 dark:text-stone-400">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Headline / Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Headline / Summary:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A masterclass in tension and worldbuilding..."
              className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Review Content:
            </label>
            <textarea
              rows="5"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What made this book memorable? Did the ending deliver? Who would you recommend it to?"
              className="w-full p-3 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
          </div>

          {/* Spoilers Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="spoilers"
              checked={hasSpoilers}
              onChange={(e) => setHasSpoilers(e.target.checked)}
              className="w-4 h-4 rounded text-forest-700 focus:ring-forest-700/30"
            />
            <label htmlFor="spoilers" className="text-xs text-stone-600 dark:text-stone-400 cursor-pointer">
              This review contains major plot spoilers
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-warm-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-cream rounded-xl shadow-md transition-colors"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Review'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
