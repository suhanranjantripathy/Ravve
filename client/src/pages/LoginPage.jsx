import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Sparkles, Check, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup, switchUser, demoUsers } = useAuthStore();

  const handleDemoSelect = (userId) => {
    switchUser(userId);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await login(username || 'elena_reads', password);
      } else {
        await signup({
          username,
          full_name: fullName,
          bio,
          favorite_genres: ['Science Fiction', 'Philosophy']
        });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-forest-800 selection:text-cream">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-cream flex items-center justify-center font-serif font-black text-2xl shadow-book">
            R
          </div>
          <span className="font-serif font-black tracking-wider text-3xl text-forest-800 dark:text-warm-100">
            RAAVE
          </span>
        </Link>
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-2">
          {activeTab === 'login' ? 'Welcome back, Reader' : 'Create your reading profile'}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Join a mindful community of book discovery and thoughtful reviews.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-stone-900 py-8 px-4 shadow-elevated border border-warm-200 dark:border-stone-800 sm:rounded-3xl sm:px-10">
          
          {/* Tabs */}
          <div className="flex rounded-xl bg-warm-100 dark:bg-stone-800 p-1 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Username / Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeTab === 'login' ? 'e.g. elena_reads' : 'e.g. bookworm42'}
                className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
              />
            </div>

            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Reading Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short sentence on what you like to read..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {activeTab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isLoading ? 'Processing...' : (activeTab === 'login' ? 'Sign In to RAAVE' : 'Create Profile')}</span>
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-warm-200 dark:border-stone-800">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3 text-center">
              Or sign in with 1-click demo persona:
            </span>
            <div className="space-y-2">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleDemoSelect(u.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-warm-50 dark:bg-stone-800/60 hover:bg-forest-50 dark:hover:bg-forest-950/40 border border-warm-200 dark:border-stone-700/60 transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">{u.full_name}</div>
                      <div className="text-[10px] text-stone-400">@{u.username}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-forest-700 dark:text-emerald-400" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
