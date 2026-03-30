import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentSession, missingSupabaseConfig, subscribeToAuthChanges } from '../services/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (missingSupabaseConfig) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession();

        if (!isMounted) {
          return;
        }

        setSession(currentSession);
        setLoading(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Error getting session:', error instanceof Error ? error.message : error);
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = subscribeToAuthChanges((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
