// Supabase client — only created when the project keys are present.
// Add these to frontend/.env (see .env.example):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
// Until they're set, `supabase` is null and the auth layer transparently falls
// back to on-device local accounts so the app still works.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
