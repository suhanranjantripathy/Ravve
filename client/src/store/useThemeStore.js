import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('raave_theme') === 'dark',
  toggleTheme: () => {
    set((state) => {
      const nextDark = !state.isDark;
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('raave_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('raave_theme', 'light');
      }
      return { isDark: nextDark };
    });
  },
  initTheme: () => {
    const saved = localStorage.getItem('raave_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = saved === 'dark' || (!saved && prefersDark);
    if (shouldDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark: shouldDark });
  }
}));
