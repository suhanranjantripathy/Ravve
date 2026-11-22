import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, Bookmark, BookOpen, Check, Heart, MessageSquare, 
  Share2, Scale, AlertTriangle, User, Calendar, Book 
} from 'lucide-react';
import { api } from '../services/api';
import BookCard from '../components/books/BookCard';
import ReviewModal from '../components/books/ReviewModal';
import ProgressModal from '../components/books/ProgressModal';

export default function BookDetailsPage() {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [userBook, setUserBook] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [reviews, setReviews] = useState([]);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [reviewSort, setReviewSort] = useState('helpful');
  const [newCommentText, setNewCommentText] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookData();
  }, [id]);

  const loadBookData = async () => {
    setIsLoading(true);
    try {
      const [bookRes, reviewsRes] = await Promise.all([
        api.getBookDetails(id),
        api.getBookReviews(id, reviewSort)
      ]);

      setBook(bookRes.book);
      setUserBook(bookRes.userBook);
      setRatingDistribution(bookRes.ratingDistribution);
      setSimilarBooks(bookRes.similarBooks || []);
      setReviews(reviewsRes.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShelfSelect = async (shelfType) => {
    try {
      await api.addBookToShelf(book.id, shelfType);
      loadBookData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeReview = async (reviewId) => {
    try {
      const res = await api.likeReview(reviewId);
      setReviews(prev => prev.map(r => r.id === reviewId ? {
        ...r,
        user_has_liked: res.liked,
        likes_count: res.likes_count
      } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (reviewId) => {
    const text = newCommentText[reviewId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.addComment(reviewId, text.trim());
      setReviews(prev => prev.map(r => r.id === reviewId ? {
        ...r,
        comments: [...(r.comments || []), res.comment]
      } : r));
      setNewCommentText(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !book) {
    return (
      <div className="p-12 text-center animate-pulse">
        <div className="w-16 h-16 rounded-full bg-warm-200 dark:bg-stone-800 mx-auto mb-4" />
        <div className="h-6 w-48 bg-warm-200 dark:bg-stone-800 mx-auto rounded-md" />
      </div>
    );
  }

  const totalReviewsCount = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* SECTION 1: BOOK HEADER SPOTLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
        
        {/* Cover Column with 3D Depth */}
        <div className="flex flex-col items-center">
          <div className="w-48 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-book-lg book-card-3d bg-warm-100 dark:bg-stone-800 mb-6">
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          </div>

          {/* Shelving Controls */}
          <div className="w-full max-w-xs space-y-2">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-warm-100 dark:bg-stone-800 text-xs">
              <button
                onClick={() => handleShelfSelect('want_to_read')}
                className={`py-2 px-1 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${
                  userBook?.shelf_type === 'want_to_read'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="text-[10px]">Want to Read</span>
              </button>

              <button
                onClick={() => handleShelfSelect('currently_reading')}
                className={`py-2 px-1 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${
                  userBook?.shelf_type === 'currently_reading'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px]">Reading</span>
              </button>

              <button
                onClick={() => handleShelfSelect('read')}
                className={`py-2 px-1 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${
                  userBook?.shelf_type === 'read'
                    ? 'bg-forest-100 dark:bg-forest-950 text-forest-900 dark:text-forest-200 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span className="text-[10px]">Read</span>
              </button>
            </div>

            {/* Reading Tracker Button */}
            {userBook?.shelf_type === 'currently_reading' && (
              <button
                onClick={() => setShowProgressModal(true)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Track Reading Progress ({userBook.current_page || 0} / {book.page_count}p)</span>
              </button>
            )}

            {/* Compare Button */}
            <Link
              to={`/compare?book1=${book.id}`}
              className="w-full py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-warm-100 dark:hover:bg-stone-800 border border-warm-300 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-stone-400" />
              <span>Compare with another book</span>
            </Link>
          </div>
        </div>

        {/* Book Synopsis & Details Column */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-forest-50 text-forest-800 dark:bg-forest-950/60 dark:text-emerald-300 border border-forest-800/20">
                {book.genre || 'General'}
              </span>
              {book.isbn && (
                <span className="text-xs text-stone-400 font-mono">ISBN: {book.isbn}</span>
              )}
            </div>

            <h1 className="font-serif font-black text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 leading-tight mb-2">
              {book.title}
            </h1>
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300 mb-4">
              by <span className="text-forest-800 dark:text-emerald-400 font-serif">{book.author}</span>
            </p>

            {/* Rating Stars Summary */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(book.average_rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300 dark:text-stone-700'
                    }`}
                  />
                ))}
              </div>
              <span className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                {Number(book.average_rating).toFixed(2)}
              </span>
              <span className="text-xs text-stone-400">
                ({book.ratings_count || totalReviewsCount} ratings)
              </span>
            </div>

            {/* Description */}
            <div className="prose prose-sm dark:prose-invert text-stone-700 dark:text-stone-300 leading-relaxed mb-6 font-sans">
              <p>{book.description}</p>
            </div>
          </div>

          {/* Publishing Metadata Footprint */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-warm-200 dark:border-stone-800 text-xs">
            <div>
              <span className="block text-stone-400 font-medium">Pages</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">{book.page_count || 'N/A'} pages</span>
            </div>
            <div>
              <span className="block text-stone-400 font-medium">Publisher</span>
              <span className="font-bold text-stone-800 dark:text-stone-200 truncate block">{book.publisher || 'Independent'}</span>
            </div>
            <div>
              <span className="block text-stone-400 font-medium">Published</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">{book.published_date || 'Unknown'}</span>
            </div>
            <div>
              <span className="block text-stone-400 font-medium">Shelf Status</span>
              <span className="font-bold text-forest-700 dark:text-emerald-400 capitalize">
                {userBook?.shelf_type ? userBook.shelf_type.replace(/_/g, ' ') : 'Not Shelved'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 2: RATING DISTRIBUTION & WRITE REVIEW BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
        
        {/* Rating Bars */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-3">
            Rating Distribution
          </h3>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;
            const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-medium text-stone-500 flex items-center gap-1">
                  {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-warm-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amberGold transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-stone-400 text-[10px]">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Write a Review Callout */}
        <div className="md:col-span-2 flex flex-col justify-center items-start sm:items-end">
          <div className="max-w-md text-left sm:text-right mb-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              Read this book? Share your thoughts.
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Write a thoughtful critique, spoiler-free reflections, or rate it for fellow readers.
            </p>
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all flex items-center gap-2"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Write a Review</span>
          </button>
        </div>

      </div>

      {/* SECTION 3: COMMUNITY REVIEWS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            Community Reviews ({reviews.length})
          </h2>
          <select
            value={reviewSort}
            onChange={(e) => {
              setReviewSort(e.target.value);
              loadBookData();
            }}
            className="px-3 py-1.5 text-xs rounded-xl bg-warm-100 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
          >
            <option value="helpful">Most Helpful</option>
            <option value="latest">Latest</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
          </select>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No reviews yet for this title.</p>
            <p className="text-xs text-stone-400 mt-1">Be the first to review and set the tone for the community.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm"
              >
                {/* Reviewer Header */}
                <div className="flex items-center justify-between mb-3">
                  <Link to={`/profile/${rev.username}`} className="flex items-center gap-3 group">
                    <img src={rev.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-warm-300" />
                    <div>
                      <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 group-hover:text-forest-700">
                        {rev.full_name}
                      </div>
                      <div className="text-[10px] text-stone-400">@{rev.username}</div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Review Headline & Content */}
                {rev.title && (
                  <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-2">
                    {rev.title}
                  </h4>
                )}

                {rev.has_spoilers ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs mb-3">
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Spoiler Warning
                    </span>
                    <p className="text-stone-700 dark:text-stone-300">{rev.content}</p>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed mb-4">
                    {rev.content}
                  </p>
                )}

                {/* Like & Comments Action Bar */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-warm-100 dark:border-stone-800">
                  <button
                    onClick={() => handleLikeReview(rev.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      rev.user_has_liked
                        ? 'bg-rose-50 text-rose-600 font-semibold'
                        : 'text-stone-500 hover:bg-warm-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${rev.user_has_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{rev.likes_count} likes</span>
                  </button>

                  <span className="text-[10px] text-stone-400">
                    {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Comments List */}
                {rev.comments && rev.comments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-warm-100 dark:border-stone-800 space-y-2">
                    <span className="text-[11px] font-bold text-stone-500 block">Comments:</span>
                    {rev.comments.map((c) => (
                      <div key={c.id} className="text-xs p-2.5 rounded-xl bg-warm-50 dark:bg-stone-800/60">
                        <div className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200 mb-0.5">
                          <span>{c.full_name}</span>
                          <span className="text-[10px] text-stone-400">@{c.username}</span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newCommentText[rev.id] || ''}
                    onChange={(e) => setNewCommentText({ ...newCommentText, [rev.id]: e.target.value })}
                    placeholder="Reply to this review..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                  <button
                    onClick={() => handleAddComment(rev.id)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-forest-800 text-cream hover:bg-forest-900"
                  >
                    Reply
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4: SIMILAR BOOKS */}
      {similarBooks.length > 0 && (
        <section>
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 mb-4">
            Readers Also Enjoyed
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarBooks.map((simBook) => (
              <BookCard key={simBook.id} book={simBook} />
            ))}
          </div>
        </section>
      )}

      {/* Review Modal */}
      <ReviewModal
        book={book}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onReviewSubmitted={() => loadBookData()}
      />

      {/* Progress Modal */}
      <ProgressModal
        book={{ ...book, ...userBook }}
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onUpdated={() => loadBookData()}
      />

    </div>
  );
}
