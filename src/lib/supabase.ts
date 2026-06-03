import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const hasSupabase = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient = hasSupabase
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      auth: { flowType: 'pkce' },
    })
  : ({} as unknown as SupabaseClient);

export function assertSupabase(): SupabaseClient {
  if (!hasSupabase || !supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_KEY.'
    );
  }
  return supabase;
}
