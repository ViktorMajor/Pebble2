import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [errorText, setErrorText] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      setSession(data.session);
    } catch {
      setSession(null);
      setErrorText('Could not restore your session.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const timeout = setTimeout(() => {
      void refresh();
    }, 0);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setErrorText(null);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [refresh]);

  return {
    errorText,
    isLoading,
    refresh,
    session,
  };
}
