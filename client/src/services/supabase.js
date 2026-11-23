import { createClient } from '@supabase/supabase-js';

export const sanitizeSupabaseUrl = (rawUrl) => {
  if (!rawUrl) return '';
  return rawUrl.trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/+$/, '');
};

const DEFAULT_SUPABASE_URL = 'https://oucpiezfhjuhvthvhunz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_KgTnMm8-iHvmWQJLr0mRcg_BA7tWWfj';

export const getSupabaseConfig = () => {
  const rawUrl = localStorage.getItem('raave_supabase_url') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem('raave_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  return { 
    url: sanitizeSupabaseUrl(rawUrl), 
    key: key.trim() 
  };
};

const { url: initialUrl, key: initialKey } = getSupabaseConfig();

export let isSupabaseConfigured = Boolean(
  initialUrl && 
  initialKey && 
  !initialUrl.includes('your-project-id') &&
  !initialUrl.includes('your-project-ref')
);

export let supabase = isSupabaseConfigured
  ? createClient(initialUrl, initialKey)
  : null;

export const setSupabaseCredentials = (newUrl, newKey) => {
  if (!newUrl || !newKey) return false;
  const cleanUrl = sanitizeSupabaseUrl(newUrl);
  const cleanKey = newKey.trim();
  localStorage.setItem('raave_supabase_url', cleanUrl);
  localStorage.setItem('raave_supabase_anon_key', cleanKey);
  supabase = createClient(cleanUrl, cleanKey);
  isSupabaseConfigured = true;
  return true;
};

export const clearSupabaseCredentials = () => {
  localStorage.removeItem('raave_supabase_url');
  localStorage.removeItem('raave_supabase_anon_key');
  supabase = null;
  isSupabaseConfigured = false;
};
