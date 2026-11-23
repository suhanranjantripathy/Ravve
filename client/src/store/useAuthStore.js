import { create } from 'zustand';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  demoUsers: [],
  isSupabaseConnected: isSupabaseConfigured,

  initAuth: async () => {
    try {
      // 1. If Supabase is configured, check for existing Supabase session
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          localStorage.setItem('raave_user_id', session.user.id);
          try {
            const res = await api.getCurrentUser();
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false
            });
            return;
          } catch (_) { }
        }

        // Listen for Supabase auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            localStorage.setItem('raave_user_id', session.user.id);
            try {
              const res = await api.getCurrentUser();
              set({ user: res.user, isAuthenticated: true });
            } catch (_) { }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false });
          }
        });
      }

      // 2. Default local/demo initialization
      const storedUserId = localStorage.getItem('raave_user_id') || 'usr_elena';
      localStorage.setItem('raave_user_id', storedUserId);

      const [userRes, demoRes] = await Promise.all([
        api.getCurrentUser().catch(() => ({ user: null })),
        api.getDemoUsers().catch(() => ({ users: [] }))
      ]);

      set({
        user: userRes.user,
        isAuthenticated: Boolean(userRes.user),
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

    login: async (emailOrUsername, password) => {
      // If Supabase is configured and email is provided
      if (isSupabaseConfigured && supabase && emailOrUsername.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrUsername,
          password
        });
        if (error) throw error;
        localStorage.setItem('raave_user_id', data.user.id);
        const res = await api.getCurrentUser();
        set({ user: res.user, isAuthenticated: true });
        return res.user;
      }

      // Default backend login
      const res = await api.login({ username: emailOrUsername, password });
      localStorage.setItem('raave_user_id', res.user.id);
      set({ user: res.user, isAuthenticated: true });
      return res.user;
    },

      signup: async (data) => {
        if (isSupabaseConfigured && supabase && data.email) {
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                username: data.username,
                full_name: data.full_name
              }
            }
          });
          if (error) throw error;
        }

        const res = await api.signup(data);
        localStorage.setItem('raave_user_id', res.user.id);
        set({ user: res.user, isAuthenticated: true });
        return res.user;
      },

          loginWithGoogle: async () => {
            if (isSupabaseConfigured && supabase) {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
              });
              if (error) throw error;
            } else {
              throw new Error('Supabase is not configured yet. Please provide your Supabase credentials.');
            }
          },

            forgotPassword: async (email) => {
              if (isSupabaseConfigured && supabase) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/login`
                });
                if (error) throw error;
              } else {
                throw new Error('Supabase is not configured yet. Please provide your Supabase credentials.');
              }
            },

              logout: async () => {
                if (isSupabaseConfigured && supabase) {
                  try {
                    await supabase.auth.signOut();
                  } catch (_) { }
                }
                localStorage.removeItem('raave_user_id');
                set({ user: null, isAuthenticated: false });
              },

                updateUserProfile: async (updatedData) => {
                  const res = await api.updateProfile(updatedData);
                  set({ user: res.profile });
                  return res.profile;
                }
        }));
