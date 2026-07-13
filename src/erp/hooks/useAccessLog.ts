import { useEffect } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';

type AccessEvent = 'sign_in' | 'sign_out' | 'session_refresh' | 'sign_in_failed';

async function logAccess(event: AccessEvent, userId?: string, email?: string, provider?: string) {
  if (!hasSupabase) return;
  try {
    await supabase.from('erp_access_log').insert({
      user_id: userId ?? null,
      email: email ?? null,
      event,
      provider: provider ?? null,
      user_agent: navigator.userAgent.slice(0, 200),
    });
  } catch {
    // Non-critical — never throw
  }
}

export function useAccessLog() {
  useEffect(() => {
    if (!hasSupabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;
      const email  = session?.user?.email;
      const provider = (session?.user as any)?.app_metadata?.provider;

      if (event === 'SIGNED_IN')          logAccess('sign_in', userId, email, provider);
      else if (event === 'SIGNED_OUT')    logAccess('sign_out', userId, email);
      else if (event === 'TOKEN_REFRESHED') logAccess('session_refresh', userId, email);
    });

    return () => subscription.unsubscribe();
  }, []);
}
