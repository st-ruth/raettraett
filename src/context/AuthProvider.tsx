import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);

  useEffect(() => {
    // Kolla om någon redan är inloggad när appen startar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Lyssna på inloggning/utloggning i realtid
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enkel funktion för att logga ut
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const requireAuth = (message: string) => {
    if (user) return true;
    setAuthPrompt(message);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        authPrompt,
        requireAuth,
        clearAuthPrompt: () => setAuthPrompt(null),
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}