import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, SlidersHorizontal, Star, Sparkles, BookOpen, 
  Compass, Flame, ArrowUpDown 
} from 'lucide-react';
import { api } from '../services/api';
import BookCard from '../components/books/BookCard';
import ProgressModal from '../components/books/ProgressModal';

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState('all'); // all, title, author, isbn, genre
  const [sortBy, setSortBy] = useState('popularity'); // popularity, rating, date, title
  const [minRating, setMinRating] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('');
  
  const [books, setBooks] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    } else {
      loadInitialData();
    }
  }, [initialQuery]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [trendRes, genresRes] = await Promise.all([
        api.getTrendingBooks(),
        api.getGenres()
      ]);
      setTrendingBooks(trendRes.books || []);
      setGenres(genresRes.genres || []);
      setBooks(trendRes.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchTerm = query) => {
    setIsLoading(true);
    try {
      const res = await api.searchBooks(searchTerm, filterType, sortBy, minRating);
      setBooks(res.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreClick = async (genreName) => {
    setSelectedGenre(genreName);
    setIsLoading(true);
    try {
      const res = await api.getBooksByGenre(genreName);
      setBooks(res.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      handleSearch(query.trim());
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <div className="pb-4 border-b border-warm-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
          Book Exploration
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
          Discover Your Next Great Read
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Search real-time across Google Books and our curated community catalogue.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm space-y-4">
        
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, ISBN (e.g. Dune, Andy Weir, 9780593135204)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Filter Type Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 text-xs font-semibold rounded-2xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 focus:outline-none"
          >
            <option value="all">All Fields</option>
            <option value="title">By Title</option>
            <option value="author">By Author</option>
            <option value="isbn">By ISBN</option>
            <option value="genre">By Genre</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Filters & Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-warm-100 dark:border-stone-800 text-xs">
          
          {/* Min Rating Filter */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500 dark:text-stone-400">Rating:</span>
            {[0, 3.5, 4.0, 4.5].map((rating) => (
              <button
                key={rating}
                onClick={() => {
                  setMinRating(rating);
                  handleSearch();
                }}
                className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                  minRating === rating
                    ? 'bg-amberGold text-white font-bold'
                    : 'bg-warm-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-warm-200'
                }`}
              >
                {rating === 0 ? 'All Ratings' : `${rating}+ ★`}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-semibold text-stone-500 dark:text-stone-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                handleSearch();
              }}
              className="px-2.5 py-1 text-xs rounded-xl bg-warm-100 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 focus:outline-none"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="date">Publication Date</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Popular Genres Carousel */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
            Browse by Genre
          </span>
          {selectedGenre && (
            <button
              onClick={() => {
                setSelectedGenre('');
                loadInitialData();
              }}
              className="text-xs text-forest-700 dark:text-emerald-400 hover:underline"
            >
              Clear Genre ({selectedGenre})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((g) => (
            <button
              key={g.name}
              onClick={() => handleGenreClick(g.name)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedGenre === g.name
                  ? 'bg-forest-800 text-cream border-transparent shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-warm-200 dark:border-stone-800 hover:bg-warm-100'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </section>

      {/* Book Results Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            {selectedGenre
              ? `${selectedGenre} Titles`
              : query
              ? `Search Results for "${query}"`
              : 'Trending & Popular Books'}
          </h2>
          <span className="text-xs text-stone-400 font-medium">
            {books.length} books found
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-warm-200 dark:bg-stone-800 aspect-[2/3] rounded-2xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
            <BookOpen className="w-10 h-10 text-stone-400 mx-auto mb-3 opacity-60" />
            <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">No books found</h3>
            <p className="text-xs text-stone-400 mt-1">Try another search keyword, title, or author name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onTrackProgress={(b) => setSelectedBookForProgress(b)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Reading Progress Modal */}
      <ProgressModal
        book={selectedBookForProgress}
        isOpen={Boolean(selectedBookForProgress)}
        onClose={() => setSelectedBookForProgress(null)}
      />

    </div>
  );
}
