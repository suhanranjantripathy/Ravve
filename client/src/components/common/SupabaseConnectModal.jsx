import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, Sparkles, ExternalLink, Key } from 'lucide-react';
import { getSupabaseConfig, setSupabaseCredentials, clearSupabaseCredentials } from '../../services/supabase';

export default function SupabaseConnectModal({ isOpen, onClose, onConnected }) {
  if (!isOpen) return null;

  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.key || '');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState(null); // 'success' | 'error'

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setStatusType('error');
      setStatusMessage('Please enter both Supabase Project URL and Anon Public Key.');
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      // Test the credentials by making a lightweight request
      const cleanUrl = url.trim().replace(/\/+$/, '');
      const testRes = await fetch(`${cleanUrl}/auth/v1/settings`, {
        headers: {
          'apikey': anonKey.trim(),
          'Authorization': `Bearer ${anonKey.trim()}`
        }
      });

      if (!testRes.ok && testRes.status !== 401 && testRes.status !== 200) {
        throw new Error(`Connection failed with HTTP ${testRes.status}. Please check your URL.`);
      }

      // Save credentials in browser localStorage
      setSupabaseCredentials(cleanUrl, anonKey.trim());

      // Also notify backend to persist into .env if running
      try {
        await fetch('/api/auth/configure-supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUrl: cleanUrl,
            supabaseAnonKey: anonKey.trim()
          })
        });
      } catch (_) {}

      setStatusType('success');
      setStatusMessage('🎉 Successfully connected to Supabase! Real cloud authentication is now active.');

      setTimeout(() => {
        if (onConnected) onConnected();
        onClose();
        window.location.reload(); // Reload to initialize fresh client
      }, 1500);
    } catch (err) {
      setStatusType('error');
      setStatusMessage(err.message || 'Failed to verify Supabase credentials. Check that URL and Anon Key are correct.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setStatusType('success');
    setStatusMessage('Disconnected. Reverted to high-performance local database mode.');
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-warm-200 dark:border-stone-800 shadow-2xl p-6 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              Connect Supabase Cloud
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Enable real cloud authentication and PostgreSQL sync
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className={`mb-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            statusType === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {statusType === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Supabase Project URL:
              </label>
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-forest-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Find in Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzabcdefg.supabase.co"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Supabase Anon / Public Key:
            </label>
            <input
              type="password"
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Found under: Supabase Dashboard ➔ Project Settings ➔ API ➔ Project API keys (anon public).
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            {currentConfig.url ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Disconnect & Use Local Mode
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-warm-100 dark:hover:bg-stone-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2 text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amberGold" />
                <span>{isTesting ? 'Verifying...' : 'Connect Supabase'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
