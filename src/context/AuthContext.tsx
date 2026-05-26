import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Profile } from '../types';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user ?? null;

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    if (data) {
      setProfile(data as Profile);
      return;
    }
    const nextProfile = {
      id: user.id,
      email: user.email,
      target_band: '6.5',
      daily_minutes: 60,
      weak_area: '口语',
      exam_date: null,
    };
    const { data: inserted, error: insertError } = await supabase.from('profiles').insert(nextProfile).select('*').single();
    if (insertError) throw insertError;
    setProfile(inserted as Profile);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user) refreshProfile().catch(console.error);
    if (!user) setProfile(null);
  }, [user?.id, loading]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    loading,
    refreshProfile,
    signInWithEmail: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
    },
    signInWithPassword: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUpWithPassword: async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  }), [user, session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
