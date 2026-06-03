import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

export const hasSupabase = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { flowType: 'pkce' } }
);

export function assertSupabase(): SupabaseClient {
  if (!hasSupabase || !supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_KEY.'
    );
  }
  return supabase;
}
