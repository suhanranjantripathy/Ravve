import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import BookDetailsPage from './pages/BookDetailsPage';
import BookshelvesPage from './pages/BookshelvesPage';
import CurrentlyReadingPage from './pages/CurrentlyReadingPage';
import ChallengesPage from './pages/ChallengesPage';
import StatisticsPage from './pages/StatisticsPage';
import JournalPage from './pages/JournalPage';
import CommunityFeedPage from './pages/CommunityFeedPage';
import UserProfilePage from './pages/UserProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import ComparePage from './pages/ComparePage';

export default function App() {
  const { initAuth, isLoading, user } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initAuth();
    initTheme();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-stone-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-800 text-cream flex items-center justify-center font-serif font-black text-2xl shadow-book animate-bounce">
          R
        </div>
        <span className="font-serif font-bold text-base text-stone-700 dark:text-stone-300 mt-4 tracking-wider">
          Opening RAAVE...
        </span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Landing Routes */}
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Layout Routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/book/:id" element={<BookDetailsPage />} />
          <Route path="/shelves" element={<BookshelvesPage />} />
          <Route path="/currently-reading" element={<CurrentlyReadingPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/community" element={<CommunityFeedPage />} />
          <Route path="/profile/:username" element={<UserProfilePage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Route>

        {/* Fallback to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
