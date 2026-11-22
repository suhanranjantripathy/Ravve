import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';

export default function ShareProfileModal({ user, isOpen, onClose }) {
  if (!isOpen || !user) return null;

  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/profile/${user.username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-warm-200 dark:border-stone-800 shadow-2xl p-6 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-cream flex items-center justify-center font-serif font-black text-2xl mx-auto mb-3 shadow-book">
            R
          </div>
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            Share Reading Profile
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Let friends follow your bookshelves, reviews, and reading progress.
          </p>
        </div>

        {/* Visual Preview Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-forest-900 to-forest-800 text-cream shadow-elevated mb-6">
          <div className="flex items-center gap-3 mb-3">
            <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-amberGold" />
            <div>
              <div className="font-serif font-bold text-base leading-tight">{user.full_name}</div>
              <div className="text-xs text-stone-300">@{user.username}</div>
            </div>
          </div>
          <p className="text-xs text-stone-200 line-clamp-2 italic mb-3">
            "{user.bio || 'Curating thoughts, one book at a time.'}"
          </p>
          <div className="flex items-center justify-between text-[11px] text-warm-200 pt-2 border-t border-forest-700/60">
            <span>RAAVE Reading Platform</span>
            <span className="font-semibold text-amberGold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Reader Profile
            </span>
          </div>
        </div>

        {/* Share Link Copy Box */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-warm-100 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 mb-4">
          <input
            type="text"
            readOnly
            value={profileUrl}
            className="flex-1 bg-transparent px-2 text-xs text-stone-800 dark:text-stone-200 focus:outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-900 text-cream text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
        >
          Done
        </button>

      </div>
    </div>
  );
}
