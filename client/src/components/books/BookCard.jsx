import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, Check, Plus, ChevronDown, BookOpen } from 'lucide-react';
import { api } from '../../services/api';

export default function BookCard({ book, userStatus, onShelfChange, onTrackProgress }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentShelf, setCurrentShelf] = useState(userStatus?.shelf_type || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleShelfSelect = async (shelfType) => {
    setIsUpdating(true);
    try {
      await api.addBookToShelf(book.id, shelfType);
      setCurrentShelf(shelfType);
      setShowDropdown(false);
      if (onShelfChange) onShelfChange(book.id, shelfType);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getShelfBadge = () => {
    if (currentShelf === 'currently_reading') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <BookOpen className="w-3 h-3" /> Reading
        </span>
      );
    }
    if (currentShelf === 'read') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-forest-100 text-forest-800 dark:bg-forest-950 dark:text-forest-200">
          <Check className="w-3 h-3" /> Read
        </span>
      );
    }
    if (currentShelf === 'want_to_read') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Bookmark className="w-3 h-3" /> Want to Read
        </span>
      );
    }
    return null;
  };

  return (
    <div className="group relative flex flex-col h-full bg-white dark:bg-stone-900 rounded-2xl border border-warm-200/80 dark:border-stone-800 p-3 shadow-sm hover:shadow-elevated transition-all duration-300">
      
      {/* Cover Image Container with 3D Depth */}
      <Link to={`/book/${book.id}`} className="block relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-warm-100 dark:bg-stone-800 book-card-3d mb-3 shadow-book">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-forest-800 to-forest-900 text-cream">
            <BookOpen className="w-8 h-8 opacity-60 mb-2" />
            <span className="font-serif font-bold text-xs line-clamp-3">{book.title}</span>
          </div>
        )}

        {/* Rating Floating Tag */}
        {book.average_rating > 0 && (
          <div className="absolute top-2 right-2 bg-stone-950/80 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{Number(book.average_rating).toFixed(1)}</span>
          </div>
        )}
      </Link>

      {/* Book Metadata */}
      <div className="flex-1 flex flex-col">
        <div className="mb-1 flex items-center justify-between gap-2">
          {book.genre && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-warm-500 dark:text-stone-400">
              {book.genre}
            </span>
          )}
          {getShelfBadge()}
        </div>

        <Link to={`/book/${book.id}`} className="block">
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-forest-700 dark:group-hover:text-emerald-400 line-clamp-1 leading-snug transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mb-3">
          {book.author}
        </p>

        {/* Action Button: Add to Shelf / Update Progress */}
        <div className="mt-auto relative pt-1">
          {currentShelf === 'currently_reading' && onTrackProgress ? (
            <button
              onClick={() => onTrackProgress(book)}
              className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-cream transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Update Progress</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isUpdating}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border ${
                  currentShelf
                    ? 'bg-warm-100 dark:bg-stone-800 border-warm-300 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                    : 'bg-forest-800 text-cream border-transparent hover:bg-forest-900 shadow-sm'
                }`}
              >
                <span className="truncate">
                  {currentShelf ? 'Change Shelf' : 'Add to Shelf'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </button>

              {/* Shelf Dropdown Menu */}
              {showDropdown && (
                <div className="absolute left-0 bottom-full mb-1 w-full bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-warm-200 dark:border-stone-800 py-1.5 z-30">
                  <button
                    onClick={() => handleShelfSelect('want_to_read')}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-warm-100 dark:hover:bg-stone-800 flex items-center justify-between ${
                      currentShelf === 'want_to_read' ? 'font-bold text-forest-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span>Want to Read</span>
                    {currentShelf === 'want_to_read' && <Check className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => handleShelfSelect('currently_reading')}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-warm-100 dark:hover:bg-stone-800 flex items-center justify-between ${
                      currentShelf === 'currently_reading' ? 'font-bold text-forest-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span>Currently Reading</span>
                    {currentShelf === 'currently_reading' && <Check className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => handleShelfSelect('read')}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-warm-100 dark:hover:bg-stone-800 flex items-center justify-between ${
                      currentShelf === 'read' ? 'font-bold text-forest-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span>Read</span>
                    {currentShelf === 'read' && <Check className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
