import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  demoUsers: [],

  initAuth: async () => {
    try {
      const storedUserId = localStorage.getItem('raave_user_id') || 'usr_elena';
      localStorage.setItem('raave_user_id', storedUserId);

      const [userRes, demoRes] = await Promise.all([
        api.getCurrentUser(),
        api.getDemoUsers()
      ]);

      set({
        user: userRes.user,
        isAuthenticated: true,
        demoUsers: demoRes.users || [],
        isLoading: false
      });
    } catch (error) {
      console.warn('Failed to load initial user:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  switchUser: async (userId) => {
    set({ isLoading: true });
    localStorage.setItem('raave_user_id', userId);
    try {
      const res = await api.getCurrentUser();
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to switch user:', error);
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    const res = await api.login({ username, password });
    localStorage.setItem('raave_user_id', res.user.id);
    set({ user: res.user, isAuthenticated: true });
    return res.user;
  },

  signup: async (data) => {
    const res = await api.signup(data);
    localStorage.setItem('raave_user_id', res.user.id);
    set({ user: res.user, isAuthenticated: true });
    return res.user;
  },

  logout: () => {
    localStorage.removeItem('raave_user_id');
    set({ user: null, isAuthenticated: false });
  },

  updateUserProfile: async (updatedData) => {
    const res = await api.updateProfile(updatedData);
    set({ user: res.profile });
    return res.profile;
  }
}));
