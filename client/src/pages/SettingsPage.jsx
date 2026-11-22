import React, { useState } from 'react';
import { 
  Settings, User, Moon, Sun, Download, Upload, Shield, 
  Check, ArrowRight, Save 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { api } from '../services/api';

export default function SettingsPage() {
  const { user, updateUserProfile } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentlyReadingStatus, setCurrentlyReadingStatus] = useState(user?.currently_reading_status || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        full_name: fullName,
        bio,
        currently_reading_status: currentlyReadingStatus
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = () => {
    window.location.href = api.exportCsvUrl();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="pb-4 border-b border-warm-200 dark:border-stone-800">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-500 dark:text-stone-400">
          Preferences & Account
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
          Account Settings
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Customize your profile, dark theme preference, and export reading data.
        </p>
      </div>

      {/* Profile Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm">
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-forest-800 dark:text-emerald-400" />
          <span>Public Profile Information</span>
        </h3>

        {isSaved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Display Name:
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Reading Bio:
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 text-xs rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Currently Reading Status Headline:
            </label>
            <input
              type="text"
              value={currentlyReadingStatus}
              onChange={(e) => setCurrentlyReadingStatus(e.target.value)}
              placeholder="e.g. Deep into Children of Time"
              className="w-full px-3 py-2 text-sm rounded-xl bg-warm-50 dark:bg-stone-800 border border-warm-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-cream shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            Appearance & Dark Mode
          </h3>
          <p className="text-xs text-stone-400">Toggle between warm off-white parchment and obsidian night theme.</p>
        </div>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-warm-100 dark:bg-stone-800 border border-warm-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-2"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
        </button>
      </div>

      {/* Data Export / Backup */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            Export Reading History
          </h3>
          <p className="text-xs text-stone-400">Download a full CSV export of your shelves, ratings, progress, and review notes.</p>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 border border-warm-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-warm-100 transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

    </div>
  );
}
