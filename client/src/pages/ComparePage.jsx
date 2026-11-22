import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Scale, BookOpen, Star, Calendar, Bookmark, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const initialBook1 = searchParams.get('book1') || 'book_dune';
  const initialBook2 = searchParams.get('book2') || 'book_project_hail_mary';

  const [book1Id, setBook1Id] = useState(initialBook1);
  const [book2Id, setBook2Id] = useState(initialBook2);
  const [allBooks, setAllBooks] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooksCatalog();
  }, []);

  useEffect(() => {
    if (book1Id && book2Id) {
      loadComparison();
    }
  }, [book1Id, book2Id]);

  const loadBooksCatalog = async () => {
    try {
      const res = await api.getUserBooks('all');
      setAllBooks(res.books || []);
    } catch (_) {}
  };

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const res = await api.compareBooks(book1Id, book2Id);
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pb-4 border-b border-warm-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
          Book Comparison Tool
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
          Side-by-Side Book Comparison
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Compare page lengths, community ratings, genre tags, and publishing background before diving in.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-stone-500 mb-1">Book 1:</label>
          <select
            value={book1Id}
            onChange={(e) => setBook1Id(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium"
          >
            <option value="book_dune">Dune</option>
            <option value="book_project_hail_mary">Project Hail Mary</option>
            <option value="book_three_body">The Three-Body Problem</option>
            <option value="book_atomic_habits">Atomic Habits</option>
            <option value="book_meditations">Meditations</option>
            <option value="book_piranesi">Piranesi</option>
            <option value="book_tomorrow">Tomorrow, and Tomorrow, and Tomorrow</option>
          </select>
        </div>

        <div className="w-10 h-10 rounded-full bg-forest-800 text-cream flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
          VS
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-stone-500 mb-1">Book 2:</label>
          <select
            value={book2Id}
            onChange={(e) => setBook2Id(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium"
          >
            <option value="book_project_hail_mary">Project Hail Mary</option>
            <option value="book_dune">Dune</option>
            <option value="book_three_body">The Three-Body Problem</option>
            <option value="book_atomic_habits">Atomic Habits</option>
            <option value="book_meditations">Meditations</option>
            <option value="book_piranesi">Piranesi</option>
            <option value="book_tomorrow">Tomorrow, and Tomorrow, and Tomorrow</option>
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      {isLoading || !comparison ? (
        <div className="grid grid-cols-2 gap-6 animate-pulse">
          <div className="h-96 rounded-3xl bg-warm-200 dark:bg-stone-800" />
          <div className="h-96 rounded-3xl bg-warm-200 dark:bg-stone-800" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Book 1 Column */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex gap-4 items-start">
              <img src={comparison.book1.cover_url} alt="" className="w-24 aspect-[2/3] object-cover rounded-xl shadow-book shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
                  {comparison.book1.genre}
                </span>
                <h3 className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
                  {comparison.book1.title}
                </h3>
                <p className="text-xs text-stone-500">{comparison.book1.author}</p>
                
                <div className="flex items-center gap-1.5 text-amber-500 mt-2 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{comparison.book1.average_rating} ★</span>
                  <span className="text-[11px] text-stone-400 font-normal">({comparison.book1.ratings_count} ratings)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-warm-100 dark:border-stone-800 text-xs">
              <div className="flex justify-between py-1 border-b border-warm-100 dark:border-stone-800">
                <span className="text-stone-400 font-medium">Page Count</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{comparison.book1.page_count} pages</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100 dark:border-stone-800">
                <span className="text-stone-400 font-medium">Publisher</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{comparison.book1.publisher}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100 dark:border-stone-800">
                <span className="text-stone-400 font-medium">Published Date</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{comparison.book1.published_date}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-4">
              {comparison.book1.description}
            </p>

            <Link
              to={`/book/${comparison.book1.id}`}
              className="block py-2 text-center text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream rounded-xl shadow-sm transition-colors"
            >
              View Book 1 Details
            </Link>
          </div>

          {/* Book 2 Column */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex gap-4 items-start">
              <img src={comparison.book2.cover_url} alt="" className="w-24 aspect-[2/3] object-cover rounded-xl shadow-book shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
                  {comparison.book2.genre}
                </span>
                <h3 className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
                  {comparison.book2.title}
                </h3>
                <p className="text-xs text-stone-500">{comparison.book2.author}</p>
                
                <div className="flex items-center gap-1.5 text-amber-500 mt-2 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{comparison.book2.average_rating} ★</span>
                  <span className="text-[11px] text-stone-400 font-normal">({comparison.book2.ratings_count} ratings)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-warm-100 dark:border-stone-800 text-xs">
              <div className="flex justify-between py-1 border-b border-warm-100 dark:border-stone-800">
                <span className="text-stone-400 font-medium">Page Count</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{comparison.book2.page_count} pages</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100 dark:border-stone-800">
                <span className="text-stone-400 font-medium">Publisher</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{comparison.book2.publisher}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100 dark:border-stone-800">
                <span className="text-stone-400 font-medium">Published Date</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{comparison.book2.published_date}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-4">
              {comparison.book2.description}
            </p>

            <Link
              to={`/book/${comparison.book2.id}`}
              className="block py-2 text-center text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream rounded-xl shadow-sm transition-colors"
            >
              View Book 2 Details
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
