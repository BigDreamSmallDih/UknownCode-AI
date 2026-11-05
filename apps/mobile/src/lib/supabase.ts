import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getItem, removeItem, setItem } from './storage';

/**
 * Supabase client for the app. Only the project URL and the *publishable* key are used here;
 * both are safe to ship in the app. Row Level Security protects the data. Never put a
 * service-role or secret key in the mobile app.
 */
const url: string = import.meta.env.VITE_SUPABASE_URL ?? '';
const publishableKey: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

export const isSupabaseConfigured = url.startsWith('https://') && publishableKey.length > 0;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createClient(url, publishableKey, {
    auth: {
      // Sessions persist in Capacitor Preferences (Android) or localStorage (browser dev).
      storage: {
        getItem: (key: string) => getItem(key),
        setItem: async (key: string, value: string) => {
          await setItem(key, value);
        },
        removeItem: async (key: string) => {
          await removeItem(key);
        },
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
