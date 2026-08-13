import type { Session, User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Credentials = { email: string; password: string; displayName?: string };

type SupabaseAuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (credentials: Credentials) => Promise<{ confirmationRequired: boolean }>;
  signOut: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

function getFallbackName(user: User | null) {
  if (!user) return null;
  const metadataName = user.user_metadata?.display_name ?? user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? null;
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Unable to restore Supabase session", error);
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: Credentials) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, displayName }: Credentials) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName?.trim() || undefined },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return { confirmationRequired: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<SupabaseAuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signUp,
    signOut,
  }), [loading, session, signIn, signOut, signUp]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  return {
    ...context,
    displayName: getFallbackName(context.user),
    isAuthenticated: Boolean(context.user),
  };
}
