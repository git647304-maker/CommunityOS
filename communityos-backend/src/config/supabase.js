import { createClient } from '@supabase/supabase-js';

let supabase = null;

export function initializeSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    console.warn('Supabase not configured. Using local auth only.');
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

export function getSupabase() {
  return supabase;
}
