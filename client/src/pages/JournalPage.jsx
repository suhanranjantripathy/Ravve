import React, { useState, useEffect } from 'react';
import { 
  PenTool, Plus, Quote, Search, Trash2, Lock, Globe, 
  Sparkles, BookOpen, Tag 
} from 'lucide-react';
import { api } from '../services/api';

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'quotes'
  const [entries, setEntries] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  
  // New Entry Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJournalData();
  }, [activeTab]);

  const loadJournalData = async () => {
    setIsLoading(true);
    try {
      const [entriesRes, quotesRes, booksRes] = await Promise.all([
        api.getJournalEntries(),
        api.getFavoriteQuotes(),
        api.getUserBooks('all')
      ]);

      setEntries(entriesRes.entries || []);
      setQuotes(quotesRes.quotes || []);
      setUserBooks(booksRes.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const quotesPayload = quoteText.trim() ? [{
      quote: quoteText.trim(),
      page: quotePage ? Number(quotePage) : null,
      note: 'Highlight from reading session'
    }] : [];

    try {
      await api.createJournalEntry({
        title: title.trim(),
        content: content.trim(),
        book_id: selectedBookId || null,
        favorite_quotes: quotesPayload,
        tags: ['Journal', 'Reflections'],
        is_private: isPrivate
      });

      setTitle('');
      setContent('');
      setSelectedBookId('');
      setQuoteText('');
      setQuotePage('');
      setShowCreateModal(false);
      loadJournalData();
    } catch (err) {
      alert(err.message || 'Failed to save entry');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      await api.deleteJournalEntry(id);
      loadJournalData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
    e.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (e.book_title && e.book_title.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredQuotes = quotes.filter(q =>
    (q.quote && q.quote.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (q.bookTitle && q.bookTitle.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-200 dark:border-stone-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
            Reading Diary
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
            Reading Journal & Quotes
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Capture private thoughts, annotate memorable prose, and collect favorite book quotes.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex rounded-2xl bg-warm-100 dark:bg-stone-800 p-1 self-start">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'entries'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
            }`}
          >
            Journal Entries ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'quotes'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
            }`}
          >
            Favorite Quotes Collection ({quotes.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search entries or quotes..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
          />
        </div>
      </div>

      {/* TAB 1: JOURNAL ENTRIES */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
              <PenTool className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-60" />
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">No journal entries yet</h3>
              <p className="text-xs text-stone-400 mt-1">Start writing notes and reflections as you read.</p>
            </div>
          ) : (
            filteredEntries.map((e) => (
              <div
                key={e.id}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {e.book_title && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-50 text-forest-800 dark:bg-forest-950/60 dark:text-emerald-300 border border-forest-800/20">
                        {e.book_title}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400">
                      {new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {e.is_private ? (
                      <span className="text-[11px] text-stone-400 flex items-center gap-1" title="Private entry">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1" title="Public entry">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteEntry(e.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-2">
                  {e.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed mb-4 whitespace-pre-line">
                  {e.content}
                </p>

                {/* Favorite Quotes Inside Entry */}
                {e.favorite_quotes && e.favorite_quotes.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-warm-50 dark:bg-stone-800/60 border border-warm-200 dark:border-stone-700/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warm-500 block">
                      Saved Quote:
                    </span>
                    {e.favorite_quotes.map((q, idx) => (
                      <blockquote key={idx} className="italic text-xs font-serif text-stone-800 dark:text-stone-200 border-l-2 border-forest-700 pl-3">
                        "{q.quote}"
                        {q.page && <span className="text-[10px] text-stone-400 not-italic block mt-0.5">— Page {q.page}</span>}
                      </blockquote>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: FAVORITE QUOTES COLLECTION */}
      {activeTab === 'quotes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotes.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
              <Quote className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-60" />
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">No quotes saved yet</h3>
              <p className="text-xs text-stone-400 mt-1">Add favorite quotes to your journal entries to see them collected here.</p>
            </div>
          ) : (
            filteredQuotes.map((q, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm flex flex-col justify-between"
              >
                <div className="mb-4">
                  <Quote className="w-6 h-6 text-amberGold mb-3 opacity-80" />
                  <p className="font-serif italic text-sm text-stone-900 dark:text-stone-100 leading-relaxed mb-3">
                    "{q.quote}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-warm-100 dark:border-stone-800">
                  <div className="truncate">
                    <span className="font-bold text-stone-800 dark:text-stone-200 truncate block">
                      {q.bookTitle}
                    </span>
                    <span className="text-[10px] text-stone-400">{q.bookAuthor}</span>
                  </div>
                  {q.page && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warm-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                      p. {q.page}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Journal Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-warm-200 dark:border-stone-800 shadow-2xl p-6">
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 mb-1">
              New Journal Entry
            </h3>
            <p className="text-xs text-stone-500 mb-4">Annotate and reflect on what you read.</p>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Associate with Book (Optional):
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-800 dark:text-stone-200"
                >
                  <option value="">General Thought (No specific book)</option>
                  {userBooks.map((b) => (
                    <option key={b.id} value={b.book_id || b.id}>{b.title} — {b.author}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Entry Title:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Philosophy of Arrakis..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Reflections & Notes:
                </label>
                <textarea
                  rows="4"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Capture your impressions, questions, or analysis..."
                  className="w-full p-3 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Quote Subfield */}
              <div className="p-3 rounded-xl bg-warm-50 dark:bg-stone-800/60 border border-warm-200 dark:border-stone-700 space-y-2">
                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1">
                  <Quote className="w-3.5 h-3.5 text-amberGold" /> Add Memorable Passage (Optional):
                </span>
                <input
                  type="text"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder='e.g. "Fear is the mind-killer..."'
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 italic"
                />
                <input
                  type="number"
                  value={quotePage}
                  onChange={(e) => setQuotePage(e.target.value)}
                  placeholder="Page number (e.g. 24)"
                  className="w-32 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Private Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privateEntry"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-forest-700"
                />
                <label htmlFor="privateEntry" className="text-xs text-stone-600 dark:text-stone-400">
                  Keep this journal entry private (only visible to you)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-warm-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream rounded-xl shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
