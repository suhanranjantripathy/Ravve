import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookMarked, Plus, Download, Upload, Grid, List, Check, 
  Trash2, ArrowUpDown, BookOpen, Star, Sparkles 
} from 'lucide-react';
import Papa from 'papaparse';
import { api } from '../services/api';
import BookCard from '../components/books/BookCard';
import ProgressModal from '../components/books/ProgressModal';

export default function BookshelvesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeShelf = searchParams.get('shelf') || 'all';

  const [books, setBooks] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [isLoading, setIsLoading] = useState(true);

  // New Custom Shelf Modal State
  const [showCreateShelfModal, setShowCreateShelfModal] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfDesc, setNewShelfDesc] = useState('');
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null);

  useEffect(() => {
    loadShelvesAndBooks();
  }, [activeShelf, sortBy, sortOrder]);

  const loadShelvesAndBooks = async () => {
    setIsLoading(true);
    try {
      const [shelvesRes, booksRes] = await Promise.all([
        api.getShelves(),
        api.getUserBooks(activeShelf, sortBy, sortOrder)
      ]);
      setShelves(shelvesRes.shelves || []);
      setBooks(booksRes.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShelf = async (e) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;

    try {
      await api.createShelf({
        name: newShelfName.trim(),
        description: newShelfDesc.trim(),
        is_public: true
      });
      setNewShelfName('');
      setNewShelfDesc('');
      setShowCreateShelfModal(false);
      loadShelvesAndBooks();
    } catch (err) {
      alert(err.message || 'Failed to create shelf');
    }
  };

  const handleRemoveBook = async (bookId) => {
    if (!window.confirm('Remove book from your shelf?')) return;
    try {
      await api.removeBookFromShelf(bookId);
      loadShelvesAndBooks();
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    window.location.href = api.exportCsvUrl();
  };

  // CSV Import (e.g. from Goodreads or RAAVE export)
  const handleImportCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedBooks = results.data.map(row => ({
            title: row.Title || row.title,
            author: row.Author || row.author,
            isbn: row.ISBN || row.isbn,
            shelf: row.Bookshelves || row.shelf || 'want_to_read',
            rating: row['My Rating'] || row.rating || null,
            page_count: row['Number of Pages'] || row['Total Pages'] || 300,
          }));

          const res = await api.importCsv(parsedBooks);
          alert(res.message);
          loadShelvesAndBooks();
        } catch (err) {
          alert('Failed to parse and import CSV: ' + err.message);
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header & Shelf Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-200 dark:border-stone-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
            Personal Library
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
            My Bookshelves
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Organize, filter, and track your physical & digital library collection.
          </p>
        </div>

        {/* Shelf Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* CSV Import */}
          <label className="cursor-pointer px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 border border-warm-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-warm-100 transition-colors flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
          </label>

          {/* CSV Export */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 border border-warm-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-warm-100 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Create Shelf */}
          <button
            onClick={() => setShowCreateShelfModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Shelf</span>
          </button>

        </div>
      </div>

      {/* Shelves Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          
          <button
            onClick={() => setSearchParams({ shelf: 'all' })}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeShelf === 'all'
                ? 'bg-forest-800 text-cream border-transparent shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-warm-200 dark:border-stone-800 hover:bg-warm-100'
            }`}
          >
            All Books
          </button>

          <button
            onClick={() => setSearchParams({ shelf: 'want_to_read' })}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeShelf === 'want_to_read'
                ? 'bg-forest-800 text-cream border-transparent shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-warm-200 dark:border-stone-800 hover:bg-warm-100'
            }`}
          >
            Want to Read
          </button>

          <button
            onClick={() => setSearchParams({ shelf: 'currently_reading' })}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeShelf === 'currently_reading'
                ? 'bg-forest-800 text-cream border-transparent shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-warm-200 dark:border-stone-800 hover:bg-warm-100'
            }`}
          >
            Currently Reading
          </button>

          <button
            onClick={() => setSearchParams({ shelf: 'read' })}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeShelf === 'read'
                ? 'bg-forest-800 text-cream border-transparent shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-warm-200 dark:border-stone-800 hover:bg-warm-100'
            }`}
          >
            Read
          </button>

          {/* Custom Shelves */}
          {shelves.map((shf) => (
            <button
              key={shf.id}
              onClick={() => setSearchParams({ shelf: 'custom', customShelfId: shf.id })}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                searchParams.get('customShelfId') === shf.id
                  ? 'bg-forest-800 text-cream border-transparent shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-warm-200 dark:border-stone-800 hover:bg-warm-100'
              }`}
            >
              {shf.name} ({shf.book_count || 0})
            </button>
          ))}

        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex items-center gap-3 text-xs">
          
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-warm-100 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
            >
              <option value="date_added">Date Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="author">Author</option>
              <option value="rating">Rating</option>
              <option value="progress">Reading Progress</option>
            </select>
          </div>

          <div className="flex rounded-xl bg-warm-100 dark:bg-stone-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-400'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Book Grid / List Display */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-warm-200 dark:bg-stone-800 aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
          <BookMarked className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-60" />
          <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">This shelf is currently empty</h3>
          <p className="text-xs text-stone-400 mt-1">Discover books or search your favorite titles to add them to this shelf.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              userStatus={{ shelf_type: b.shelf_type }}
              onShelfChange={() => loadShelvesAndBooks()}
              onTrackProgress={(bk) => setSelectedBookForProgress(bk)}
            />
          ))}
        </div>
      ) : (
        /* Detailed List View */
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-warm-200 dark:border-stone-800 shadow-sm divide-y divide-warm-100 dark:divide-stone-800 overflow-hidden">
          {books.map((b) => (
            <div key={b.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-warm-50 dark:hover:bg-stone-800/40 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <img src={b.cover_url} alt="" className="w-12 h-16 object-cover rounded-lg shadow-sm shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-emerald-400">
                    {b.shelf_type.replace(/_/g, ' ')}
                  </span>
                  <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                    {b.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{b.author}</p>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex items-center gap-4 shrink-0">
                {b.shelf_type === 'currently_reading' && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {b.current_page} / {b.total_pages || b.book_pages}p
                    </span>
                    <button
                      onClick={() => setSelectedBookForProgress(b)}
                      className="block text-[11px] text-forest-700 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Update
                    </button>
                  </div>
                )}

                {b.user_rating && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{b.user_rating}</span>
                  </div>
                )}

                <button
                  onClick={() => handleRemoveBook(b.book_id)}
                  className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
                  title="Remove from shelf"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Custom Shelf Modal */}
      {showCreateShelfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-warm-200 dark:border-stone-800 shadow-2xl p-6">
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 mb-2">
              Create Custom Shelf
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              e.g. "Favorites", "2026 TBR", "Sci-Fi Masterpieces", "Rereads"
            </p>

            <form onSubmit={handleCreateShelf} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Shelf Name:
                </label>
                <input
                  type="text"
                  required
                  value={newShelfName}
                  onChange={(e) => setNewShelfName(e.target.value)}
                  placeholder="e.g. Autumn Cosy Reads"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Description (Optional):
                </label>
                <input
                  type="text"
                  value={newShelfDesc}
                  onChange={(e) => setNewShelfDesc(e.target.value)}
                  placeholder="What belongs on this shelf..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateShelfModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-warm-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream rounded-xl shadow-md"
                >
                  Create Shelf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reading Progress Modal */}
      <ProgressModal
        book={selectedBookForProgress}
        isOpen={Boolean(selectedBookForProgress)}
        onClose={() => setSelectedBookForProgress(null)}
        onUpdated={() => loadShelvesAndBooks()}
      />

    </div>
  );
}
