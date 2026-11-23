import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen, Sparkles, Check, ArrowRight, UserPlus, LogIn,
  Mail, Lock, User, KeyRound, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../services/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const [activeTab, setActiveTab] = useState(defaultTab); // 'login' | 'signup' | 'forgot'
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup, loginWithGoogle, forgotPassword, switchUser, demoUsers } = useAuthStore();

  const handleDemoSelect = (userId) => {
    switchUser(userId);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await login(emailOrUsername || 'elena_reads', password);
        navigate('/dashboard');
      } else if (activeTab === 'signup') {
        await signup({
          email: email || `${username}@example.com`,
          username,
          full_name: fullName,
          bio,
          password,
          favorite_genres: ['Science Fiction', 'Philosophy']
        });
        navigate('/dashboard');
      } else if (activeTab === 'forgot') {
        await forgotPassword(email);
        setMessage('Password reset link sent! Please check your email inbox.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
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
          {activeTab === 'login' && 'Welcome back, Reader'}
          {activeTab === 'signup' && 'Create your reading profile'}
          {activeTab === 'forgot' && 'Reset your password'}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          {isSupabaseConfigured ? '🟢 Connected with Supabase Auth' : 'Mindful reading community & book discovery platform'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-stone-900 py-8 px-4 shadow-elevated border border-warm-200 dark:border-stone-800 sm:rounded-3xl sm:px-10">

          {/* Tabs */}
          {activeTab !== 'forgot' && (
            <div className="flex rounded-xl bg-warm-100 dark:bg-stone-800 p-1 mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'login'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'signup'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                  }`}
              >
                Create Account
              </button>
            </div>
          )}

          {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
          )}

              {message && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Google Auth Button if Supabase configured */}
              {isSupabaseConfigured && activeTab !== 'forgot' && (
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 border border-warm-300 dark:border-stone-700 hover:bg-warm-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-warm-200 dark:border-stone-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-stone-900 px-2 text-stone-400">Or with email</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {activeTab === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Elena Rostova"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elena@example.com"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'login' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        placeholder="e.g. elena_reads or your@email.com"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Choose Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. bookworm42"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                )}

                {activeTab === 'forgot' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Your Account Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}

                {activeTab !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab('forgot')}
                        className="text-[11px] text-forest-700 dark:text-emerald-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-forest-700/40 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {activeTab === 'login' && <LogIn className="w-4 h-4" />}
                  {activeTab === 'signup' && <UserPlus className="w-4 h-4" />}
                  {activeTab === 'forgot' && <KeyRound className="w-4 h-4" />}
                  <span>
                    {isLoading
                      ? 'Processing...'
                      : activeTab === 'login'
                        ? 'Sign In to RAAVE'
                        : activeTab === 'signup'
                          ? 'Create Profile'
                          : 'Send Reset Link'}
                  </span>
                </button>

                {activeTab === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="w-full text-center text-xs text-stone-500 hover:text-stone-900 mt-2 block"
                  >
                    ← Back to sign in
                  </button>
                )}

              </form>

              {/* One-Click Demo Personas */}
              <div className="mt-8 pt-6 border-t border-warm-200 dark:border-stone-800">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3 text-center">
                  Or sign in instantly as demo reader:
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
