import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Compass, Trophy, Users, Star, ArrowRight, Sparkles, 
  CheckCircle, Bookmark, PenTool, Shield 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 selection:bg-forest-800 selection:text-cream">
      
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-800 text-cream flex items-center justify-center font-serif font-black text-xl shadow-book">
            R
          </div>
          <span className="font-serif font-black tracking-wider text-2xl text-forest-800 dark:text-warm-100">
            RAAVE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-forest-800 dark:hover:text-emerald-400 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/login?tab=signup"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all"
          >
            Join RAAVE
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-800/10 dark:bg-emerald-950/60 text-forest-800 dark:text-emerald-300 text-xs font-semibold mb-6 border border-forest-800/20">
          <Sparkles className="w-3.5 h-3.5 text-amberGold" />
          <span>The Modern Reading Community & Discovery Platform</span>
        </div>

        <h1 className="font-serif font-black text-4xl sm:text-6xl lg:text-7xl text-stone-900 dark:text-stone-100 tracking-tight leading-[1.1] mb-6">
          Track books you love. <br />
          <span className="text-forest-800 dark:text-emerald-400 italic font-serif">Rediscover</span> the joy of reading.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 dark:text-stone-300 mb-10 leading-relaxed font-sans">
          Goodreads functionality, reimagined. Letterboxd-style social reviews, Notion-inspired reading journals, and Pinterest-grade discovery.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login?tab=signup"}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-book flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <span>{isAuthenticated ? "Go to Dashboard" : "Create Free Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            to="/discover"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-bold bg-white dark:bg-stone-900 hover:bg-warm-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-warm-300 dark:border-stone-700 shadow-sm transition-all"
          >
            Explore Books Catalogue
          </Link>
        </div>

      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-warm-200 dark:border-stone-800">
        <div className="text-center mb-12">
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 mb-3">
            Crafted for readers, not algorithms.
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Everything you need to catalogue your library, track reading pace, and exchange ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg mb-2">Google Books Discovery</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Real-time search across millions of titles, ISBNs, authors, and genres. Rich covers and detailed metadata without ads.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg mb-2">Letterboxd-Style Feed</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Follow friends, like reading updates, comment on reviews, and browse spoiler-protected ratings with clean community aesthetics.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 dark:bg-forest-950 dark:text-forest-300 flex items-center justify-center mb-4">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg mb-2">Notion-Style Reading Journal</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Capture memorable quotes, log chapter impressions, track daily reading streaks, and maintain private or public reading logs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-warm-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
        <div className="flex items-center gap-2 font-serif font-bold text-forest-800 dark:text-stone-300">
          <span>RAAVE Reading Platform</span>
        </div>
        <p>Built with PostgreSQL/Supabase, Express, React, and Tailwind CSS.</p>
      </footer>

    </div>
  );
}
