import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, BookOpen, Star, Users, Share2, Flame, Trophy, 
  Sparkles, Check, Bookmark 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import BookCard from '../components/books/BookCard';
import ShareProfileModal from '../components/common/ShareProfileModal';

export default function UserProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuthStore();
  const targetUsername = username || currentUser?.username || 'elena_reads';

  const [profileData, setProfileData] = useState(null);
  const [favoriteBooksDetails, setFavoriteBooksDetails] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [targetUsername]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProfile(targetUsername);
      setProfileData(res.profile);
      setIsFollowing(res.profile.stats?.is_following || false);

      // Fetch top 4 favorite books details (Letterboxd style)
      if (res.profile.favorite_books && res.profile.favorite_books.length > 0) {
        const bookPromises = res.profile.favorite_books.slice(0, 4).map(id => api.getBookDetails(id).catch(() => null));
        const books = await Promise.all(bookPromises);
        setFavoriteBooksDetails(books.filter(Boolean).map(b => b.book));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profileData) return;
    try {
      const res = await api.toggleFollow(profileData.id);
      setIsFollowing(res.following);
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="p-12 text-center animate-pulse">
        <div className="w-20 h-20 rounded-full bg-warm-200 dark:bg-stone-800 mx-auto mb-4" />
        <div className="h-6 w-48 bg-warm-200 dark:bg-stone-800 mx-auto rounded-md" />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileData.id;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Profile Banner & Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            <img
              src={profileData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt=""
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-forest-800/10 shadow-elevated"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                  {profileData.full_name}
                </h1>
              </div>
              <p className="text-xs text-stone-400">@{profileData.username}</p>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xl mt-2 leading-relaxed">
                {profileData.bio || 'Curating thoughts, one book at a time.'}
              </p>
            </div>
          </div>

          {/* Follow & Share Profile Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isFollowing
                    ? 'bg-warm-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-rose-50 hover:text-rose-600'
                    : 'bg-forest-800 hover:bg-forest-900 text-cream shadow-md'
                }`}
              >
                {isFollowing ? 'Following' : '+ Follow Reader'}
              </button>
            )}

            <button
              onClick={() => setShowShareModal(true)}
              className="p-2.5 rounded-2xl bg-warm-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-warm-200 transition-colors"
              title="Share reading profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Reading Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-warm-100 dark:border-stone-800 text-center sm:text-left">
          <div>
            <span className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100 block">
              {profileData.stats?.books_read || 0}
            </span>
            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Books Read</span>
          </div>

          <div>
            <span className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100 block">
              {profileData.stats?.followers_count || 0}
            </span>
            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Followers</span>
          </div>

          <div>
            <span className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100 block">
              {profileData.stats?.following_count || 0}
            </span>
            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Following</span>
          </div>

          <div>
            <span className="font-serif font-black text-2xl text-forest-800 dark:text-emerald-400 block">
              {profileData.reading_streak_days || 14}
            </span>
            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Day Streak</span>
          </div>
        </div>

      </div>

      {/* SECTION 1: LETTERBOXD-STYLE TOP 4 FAVORITE BOOKS */}
      {favoriteBooksDetails.length > 0 && (
        <section className="p-6 sm:p-8 rounded-3xl bg-warm-100/70 dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amberGold" />
            <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              All-Time Favorite Books
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {favoriteBooksDetails.map((b) => (
              <Link
                key={b.id}
                to={`/book/${b.id}`}
                className="group block relative aspect-[2/3] rounded-2xl overflow-hidden shadow-book book-card-3d bg-white"
              >
                <img src={b.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-cream">
                  <span className="font-serif font-bold text-xs line-clamp-1">{b.title}</span>
                  <span className="text-[10px] text-stone-300">{b.author}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: CURRENTLY READING SPOTLIGHT */}
      {profileData.currently_reading_books && profileData.currently_reading_books.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-forest-800 dark:text-emerald-400" />
            <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              Currently Reading
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.currently_reading_books.map((b) => (
              <div key={b.id} className="flex gap-4 p-4 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm items-center">
                <img src={b.cover_url} alt="" className="w-16 aspect-[2/3] object-cover rounded-xl shadow-book shrink-0" />
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
                    {b.title}
                  </h3>
                  <p className="text-xs text-stone-500 mb-2">{b.author}</p>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Page {b.current_page || 0} of {b.total_pages || b.page_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: RECENT REVIEWS */}
      {profileData.recent_reviews && profileData.recent_reviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            Recent Reviews & Ratings
          </h2>
          <div className="space-y-4">
            {profileData.recent_reviews.map((rev) => (
              <div key={rev.id} className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Link to={`/book/${rev.book_id}`} className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-forest-700">
                    {rev.book_title}
                  </Link>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                {rev.title && <h4 className="font-serif font-semibold text-sm mb-1">{rev.title}</h4>}
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{rev.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share Profile Modal */}
      <ShareProfileModal
        user={profileData}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

    </div>
  );
}
