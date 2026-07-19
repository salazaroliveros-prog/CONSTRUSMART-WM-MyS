import { useEffect } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { accessLogInsertSchema, type AccessEvent } from '@/erp/store/schemas';

async function logAccess(event: AccessEvent, userId?: string, email?: string, provider?: string) {
  if (!hasSupabase) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const logData = accessLogInsertSchema.parse({
      user_id: userId ?? session.user.id,
      email: email ?? session.user.email ?? null,
      event,
      provider: provider ?? (session.user.app_metadata as any)?.provider ?? null,
      user_agent: navigator.userAgent.slice(0, 200),
    });

    await supabase.from('erp_access_log').insert(logData);
  } catch (error) {
    console.warn('[useAccessLog] Failed to log access:', error);
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
