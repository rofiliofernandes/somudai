import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';

type SessionState = {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been read on launch. */
  loading: boolean;
};

const SessionContext = createContext<SessionState>({ session: null, user: null, loading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, user: null, loading: true });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
      // Never show one person's cached data to the next person on this device.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
