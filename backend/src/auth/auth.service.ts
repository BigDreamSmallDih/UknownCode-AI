import { createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.js';

export interface AuthedUser {
  id: string;
  email: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

/** Everything the routes need from the identity provider. Swappable in tests. */
export interface AuthService {
  /** Returns the user for a valid access token, or null if the token is invalid or expired. */
  verifyToken(token: string): Promise<AuthedUser | null>;
  /** Reads the caller's profile using their own token, so Row Level Security applies. */
  getProfile(token: string, userId: string): Promise<Profile | null>;
}

/** Builds the Supabase-backed service, or null when Supabase is not configured. */
export function createSupabaseAuthService(env: Env): AuthService | null {
  const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key } = env;
  if (!url || !key) return null;

  const options = { auth: { persistSession: false, autoRefreshToken: false } } as const;
  const admin = createClient(url, key, options);

  return {
    async verifyToken(token) {
      const { data, error } = await admin.auth.getUser(token);
      if (error) {
        // 4xx means the token itself was rejected. Anything else is an outage: surface it.
        if (error.status !== undefined && error.status >= 400 && error.status < 500) return null;
        throw error;
      }
      if (!data.user) return null;
      return { id: data.user.id, email: data.user.email ?? null };
    },

    async getProfile(token, userId) {
      const scoped = createClient(url, key, {
        ...options,
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await scoped
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile | null;
    },
  };
}
