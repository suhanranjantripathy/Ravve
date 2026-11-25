import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Heart, MessageSquare, Send, BookOpen, Star,
  Sparkles, CheckCircle, Bookmark, Flame, UserPlus,
  Search, AtSign, AlertCircle, Check, UserMinus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function CommunityFeedPage() {
  const { user } = useAuthStore();
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'following'
  const [activities, setActivities] = useState([]);
  const [suggestedReaders, setSuggestedReaders] = useState([]);
  const [myFriends, setMyFriends] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Follow friend by username state
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [friendSearchError, setFriendSearchError] = useState(null);
  const [friendActionMessage, setFriendActionMessage] = useState(null);
  const [isSearchingFriend, setIsSearchingFriend] = useState(false);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    loadFeed();
    loadMyFriends();
  }, [feedFilter]);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const [feedRes, sugRes] = await Promise.all([
        api.getCommunityFeed(feedFilter),
        api.getSuggestedReaders()
      ]);
      setActivities(feedRes.activities || []);
      setSuggestedReaders(sugRes.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyFriends = async () => {
    try {
      const res = await api.getMyFriends();
      setMyFriends(res.friends || []);
    } catch (err) {
      console.warn('Failed to load friends:', err);
    }
  };

  const handleFriendUsernameChange = (e) => {
    const rawVal = e.target.value;
    setFriendUsernameInput(rawVal);
    setFriendSearchError(null);
    setFriendActionMessage(null);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const clean = rawVal.replace(/^@/, '').trim();
    if (!clean) {
      setFriendSearchResult(null);
      return;
    }

    setIsSearchingFriend(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.searchUserByUsername(clean);
        setFriendSearchResult(res.user);
        setFriendSearchError(null);
      } catch (err) {
        setFriendSearchResult(null);
        setFriendSearchError(err.message || `User "@${clean}" not found.`);
      } finally {
        setIsSearchingFriend(false);
      }
    }, 350);
  };

  const handleFollowFriend = async (targetUsername) => {
    const clean = (targetUsername || friendUsernameInput).replace(/^@/, '').trim();
    if (!clean) return;

    setIsSubmittingFollow(true);
    setFriendSearchError(null);
    setFriendActionMessage(null);

    try {
      const res = await api.followByUsername(clean);
      setFriendActionMessage(res.message);
      if (friendSearchResult && friendSearchResult.username.toLowerCase() === clean.toLowerCase()) {
        setFriendSearchResult(prev => ({ ...prev, is_following: true }));
      }
      loadMyFriends();
      loadFeed();
    } catch (err) {
      setFriendSearchError(err.message || 'Failed to follow user.');
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  const handleUnfollowFriend = async (targetUsername) => {
    const clean = targetUsername.replace(/^@/, '').trim();
    try {
      const res = await api.unfollowByUsername(clean);
      setFriendActionMessage(res.message);
      if (friendSearchResult && friendSearchResult.username.toLowerCase() === clean.toLowerCase()) {
        setFriendSearchResult(prev => ({ ...prev, is_following: false }));
      }
      loadMyFriends();
      loadFeed();
    } catch (err) {
      setFriendSearchError(err.message || 'Failed to unfollow.');
    }
  };

  const handleLikeActivity = async (id) => {
    try {
      const res = await api.likeActivity(id);
      setActivities(prev => prev.map(a => a.id === id ? { ...a, likes_count: res.likes_count } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    setIsPosting(true);
    try {
      await api.postActivity(newPostText.trim());
      setNewPostText('');
      loadFeed();
    } catch (err) {
      alert(err.message || 'Failed to post update');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFollowUser = async (targetId) => {
    try {
      await api.toggleFollow(targetId);
      loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Editorial Header */}
      <div className="pb-4 border-b border-warm-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
          Social Reading Timeline
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
          Community Reading Feed
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          See what readers in your literary circle are finishing, recommending, and discussing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Post a Reading Thought Form */}
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <form onSubmit={handlePostSubmit}>
              <div className="flex gap-3 mb-3">
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-warm-300"
                />
                <textarea
                  rows="2"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Share a reading update, a thought-provoking line, or what you're picking up next..."
                  className="w-full p-3 text-xs rounded-2xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-warm-100 dark:border-stone-800">
                <span className="text-[11px] text-stone-400">Posts to your public follower stream</span>
                <button
                  type="submit"
                  disabled={isPosting || !newPostText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPosting ? 'Posting...' : 'Share Update'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex rounded-2xl bg-warm-100 dark:bg-stone-800 p-1">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${feedFilter === 'all'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                  }`}
              >
                All Community Activity
              </button>
              <button
                onClick={() => setFeedFilter('following')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${feedFilter === 'following'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                  }`}
              >
                Following Only
              </button>
            </div>
            <span className="text-xs text-stone-400">{activities.length} updates</span>
          </div>

          {/* Activity Cards List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-3xl bg-warm-200 dark:bg-stone-800 animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800">
              <Users className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-60" />
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-200">No activity yet in this feed</h3>
              <p className="text-xs text-stone-400 mt-1">Follow other readers or share your own thoughts to kickstart discussions.</p>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm"
              >
                {/* Event Actor Header */}
                <div className="flex items-center justify-between mb-3">
                  <Link to={`/profile/${act.username}`} className="flex items-center gap-3 group">
                    <img src={act.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-warm-300" />
                    <div>
                      <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 group-hover:text-forest-700">
                        {act.full_name}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {act.action_type === 'started_reading' && 'started reading'}
                        {act.action_type === 'finished_reading' && 'finished reading'}
                        {act.action_type === 'added_to_shelf' && `added to ${act.details?.shelf?.replace(/_/g, ' ') || 'shelf'}`}
                        {act.action_type === 'reviewed_book' && 'reviewed'}
                        {act.action_type === 'custom_update' && 'shared a reading update'}
                      </div>
                    </div>
                  </Link>

                  <span className="text-[10px] text-stone-400">
                    {new Date(act.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Custom Update Text */}
                {act.action_type === 'custom_update' && act.details?.text && (
                  <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed mb-3 font-sans">
                    {act.details.text}
                  </p>
                )}

                {/* Embedded Book Card */}
                {act.book_title && (
                  <div className="flex gap-4 p-3.5 rounded-2xl bg-warm-50 dark:bg-stone-800/60 border border-warm-200 dark:border-stone-700/60 mb-3 items-center">
                    <Link to={`/book/${act.book_id}`} className="shrink-0 w-14 aspect-[2/3] rounded-lg overflow-hidden shadow-sm book-card-3d bg-warm-200">
                      <img src={act.book_cover} alt="" className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/book/${act.book_id}`}>
                        <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-forest-700 truncate">
                          {act.book_title}
                        </h4>
                      </Link>
                      <p className="text-xs text-stone-500 truncate">{act.book_author}</p>

                      {/* Review Rating in Activity */}
                      {(act.review_rating || act.details?.rating) && (
                        <div className="flex items-center gap-1 text-amber-500 mt-1">
                          {Array.from({ length: act.review_rating || act.details?.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Snippet if available */}
                {act.review_content && (
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed mb-3 italic">
                    "{act.review_content}"
                  </p>
                )}

                {/* Activity Footer Actions */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-warm-100 dark:border-stone-800">
                  <button
                    onClick={() => handleLikeActivity(act.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{act.likes_count || 0} likes</span>
                  </button>

                  {act.book_id && (
                    <Link
                      to={`/book/${act.book_id}`}
                      className="text-xs font-semibold text-forest-700 dark:text-emerald-400 hover:underline"
                    >
                      View Book →
                    </Link>
                  )}
                </div>

              </div>
            ))
          )}

        </div>

        {/* Sidebar: Follow by Username & Friends */}
        <div className="space-y-6">

          {/* 1. Follow a Friend by Username Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-forest-700 dark:text-emerald-400" />
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Follow by Username
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-4">
              Connect with your friends by searching their exact reader username.
            </p>

            {/* Username Input */}
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold">
                @
              </span>
              <input
                type="text"
                value={friendUsernameInput}
                onChange={handleFriendUsernameChange}
                placeholder="friend_username..."
                className="w-full pl-7 pr-8 py-2 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
              />
              {isSearchingFriend && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <span className="w-2.5 h-2.5 rounded-full bg-forest-600 animate-ping inline-block" />
                </span>
              )}
            </div>

            {/* Error Message */}
            {friendSearchError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1.5 mb-3 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{friendSearchError}</span>
              </div>
            )}

            {/* Success Action Message */}
            {friendActionMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5 mb-3 animate-in fade-in">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{friendActionMessage}</span>
              </div>
            )}

            {/* Friend Profile Preview Card */}
            {friendSearchResult && (
              <div className="p-3 rounded-2xl bg-warm-50 dark:bg-stone-800/70 border border-warm-200 dark:border-stone-700 animate-in fade-in space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <img
                    src={friendSearchResult.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-warm-300 dark:ring-stone-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                      {friendSearchResult.full_name}
                    </div>
                    <div className="text-[11px] text-forest-700 dark:text-emerald-400 font-mono truncate">
                      @{friendSearchResult.username}
                    </div>
                    {friendSearchResult.currently_reading_status && (
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        📖 {friendSearchResult.currently_reading_status}
                      </div>
                    )}
                  </div>
                </div>

                {friendSearchResult.is_self ? (
                  <div className="text-[11px] text-stone-400 italic text-center py-1">
                    (This is your own profile)
                  </div>
                ) : friendSearchResult.is_following ? (
                  <button
                    onClick={() => handleUnfollowFriend(friendSearchResult.username)}
                    className="w-full py-1.5 rounded-xl text-xs font-semibold bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-700 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-rose-950 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Unfollow @{friendSearchResult.username}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollowFriend(friendSearchResult.username)}
                    disabled={isSubmittingFollow}
                    className="w-full py-1.5 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow @{friendSearchResult.username}</span>
                  </button>
                )}
              </div>
            )}

            {!friendSearchResult && !friendSearchError && (
              <button
                onClick={() => handleFollowFriend(friendUsernameInput)}
                disabled={!friendUsernameInput.trim() || isSubmittingFollow}
                className="w-full py-2 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Follow by Username</span>
              </button>
            )}
          </div>

          {/* 2. My Friends / Reading Circle */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-700 dark:text-emerald-400" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Friends You Follow
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-950 text-forest-800 dark:text-emerald-300">
                {myFriends.length}
              </span>
            </div>

            {myFriends.length === 0 ? (
              <p className="text-xs text-stone-400 italic">
                You haven't followed any friends yet. Type their username above to start seeing their reading updates!
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {myFriends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-warm-50 dark:hover:bg-stone-800/60 transition-colors">
                    <Link to={`/profile/${f.username}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img src={f.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-warm-200" />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                          {f.full_name}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono truncate">
                          @{f.username}
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleUnfollowFriend(f.username)}
                      title="Unfollow"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-warm-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Community Suggestions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amberGold" />
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Discover Readers
              </h3>
            </div>

            <div className="space-y-3">
              {suggestedReaders.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 pb-3 border-b border-warm-100 dark:border-stone-800 last:border-0 last:pb-0">
                  <Link to={`/profile/${r.username}`} className="flex items-start gap-2.5 min-w-0">
                    <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-warm-300" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">{r.full_name}</div>
                      <div className="text-[10px] text-forest-700 dark:text-emerald-400 font-mono truncate">@{r.username}</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">{r.bio}</div>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleFollowFriend(r.username)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-forest-800 text-cream hover:bg-forest-900 transition-colors shrink-0"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
