import { create } from 'zustand';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSupabaseConnected: isSupabaseConfigured,

  initAuth: async () => {
    try {
      // 1. If Supabase is configured, check for active session
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            localStorage.setItem('raave_user_id', session.user.id);
            const res = await api.getCurrentUser();
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false
            });
            return;
          }

          // Listen for auth state changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              localStorage.setItem('raave_user_id', session.user.id);
              try {
                const res = await api.getCurrentUser();
                set({ user: res.user, isAuthenticated: true });
              } catch (_) {}
            } else if (event === 'SIGNED_OUT') {
              localStorage.removeItem('raave_user_id');
              set({ user: null, isAuthenticated: false });
            }
          });
        } catch (e) {
          console.warn('Supabase session check error:', e);
        }
      }

      // 2. Local session check strictly for the authenticated user
      const storedUserId = localStorage.getItem('raave_user_id');
      if (!storedUserId) {
        // User is not logged in: Never default or expose another user!
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const userRes = await api.getCurrentUser();
        if (userRes?.user) {
          set({
            user: userRes.user,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          localStorage.removeItem('raave_user_id');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (_) {
        localStorage.removeItem('raave_user_id');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.warn('Failed to load initial user:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (emailOrUsername, password) => {
    let supabaseSuccess = false;
    const cleanIdentifier = (emailOrUsername || '').trim();

    // 1. Try Supabase Auth if email format
    if (isSupabaseConfigured && supabase && cleanIdentifier.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanIdentifier,
          password
        });
        if (!error && data?.user) {
          localStorage.setItem('raave_user_id', data.user.id);
          supabaseSuccess = true;
        } else if (error) {
          console.warn('Supabase auth notice:', error.message);
          // If email is not confirmed, or credentials mismatched on Supabase,
          // proceed to synced profile login below so the reader is not locked out.
        }
      } catch (sbErr) {
        console.warn('Supabase signIn catch:', sbErr?.message);
      }
    }

    // 2. Fetch/sync user from backend
    const res = await api.login({ username: cleanIdentifier, password });
    if (res?.user?.id) {
      localStorage.setItem('raave_user_id', res.user.id);
      set({ user: res.user, isAuthenticated: true });
      return res.user;
    }
    throw new Error('Failed to sign in. Please verify your credentials.');
  },

  signup: async (data) => {
    let supabaseUserId = null;
    const cleanEmail = (data.email || '').trim();

    // 1. Register in Supabase Auth if configured and valid email
    if (isSupabaseConfigured && supabase && cleanEmail) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              username: data.username,
              full_name: data.full_name
            }
          }
        });

        if (error) {
          console.warn('Supabase signUp note:', error.message);
          // If rate limit or already exists, still proceed with sync so experience is uninterrupted
          if (error.message.includes('already registered')) {
            // Attempt to login to retrieve existing user
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: data.password
            });
            if (signInData?.user) {
              supabaseUserId = signInData.user.id;
            }
          }
        } else if (authData?.user) {
          supabaseUserId = authData.user.id;
        }
      } catch (sbErr) {
        console.warn('Supabase auth registration caught:', sbErr?.message);
      }
    }

    // 2. Register/sync reader profile in database
    const res = await api.signup({
      ...data,
      id: supabaseUserId || undefined
    });

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
      throw new Error('Supabase is not configured yet. Please check your credentials.');
    }
  },

  forgotPassword: async (email) => {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      throw new Error('Please enter your account email address.');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/login`
        });
      } catch (sbErr) {
        console.warn('Supabase resetPasswordForEmail notice:', sbErr?.message);
      }
    }

    const res = await api.forgotPassword(cleanEmail);
    return res;
  },

  logout: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (_) {}
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
