import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getStoredUrl(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('kobar_supabase_url');
    if (local) return local;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const env = (import.meta as any).env;
    if (env.VITE_SUPABASE_URL) return env.VITE_SUPABASE_URL;
    if (env.NEXT_PUBLIC_SUPABASE_URL) return env.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  return '';
}

function getStoredAnonKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('kobar_supabase_anon_key');
    if (local) return local;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const env = (import.meta as any).env;
    if (env.VITE_SUPABASE_ANON_KEY) return env.VITE_SUPABASE_ANON_KEY;
    if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return '';
}

const activeUrl = getStoredUrl();
const activeKey = getStoredAnonKey();

export const isSupabaseConfigured = Boolean(
  activeUrl && 
  activeKey && 
  !activeUrl.includes('your-project') &&
  !activeKey.includes('placeholder')
);

// Fallback dummy URL so createClient does not throw on invalid URL format
const fallbackUrl = 'https://kobar-expo-demo.supabase.co';
const fallbackKey = 'dummy-anon-key-placeholder-for-offline-preview';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? activeUrl : fallbackUrl,
  isSupabaseConfigured ? activeKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kobar_supabase_url', url.trim());
    localStorage.setItem('kobar_supabase_anon_key', anonKey.trim());
    window.location.reload();
  }
}

export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kobar_supabase_url');
    localStorage.removeItem('kobar_supabase_anon_key');
    window.location.reload();
  }
}

export function getCurrentSupabaseConfig() {
  return {
    url: activeUrl,
    key: activeKey,
    isConfigured: isSupabaseConfigured,
  };
}
