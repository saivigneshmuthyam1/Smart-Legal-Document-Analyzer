/**
 * Authentication context using Supabase Auth.
 * Provides user session management, sign in/up/out, and Google OAuth.
 * Falls back to local mock auth when Supabase is not configured.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import supabase from "@/services/supabaseClient";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if Supabase is available
  const isSupabaseConfigured = !!supabase;

  // -----------------------------------------------------------------------
  // Initialize — check existing session
  // -----------------------------------------------------------------------
  useEffect(() => {
    let subscription;

    async function init() {
      if (!isSupabaseConfigured) {
        // Check localStorage for mock session
        const stored = localStorage.getItem("mock_user");
        if (stored) {
          try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
      } catch (e) {
        console.error("Failed to get session:", e);
      } finally {
        setLoading(false);
      }

      // Listen for auth state changes
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
      );
      subscription = sub;
    }

    init();
    return () => subscription?.unsubscribe?.();
  }, [isSupabaseConfigured]);

  // -----------------------------------------------------------------------
  // Sign in with email + password
  // -----------------------------------------------------------------------
  const signInWithEmail = useCallback(async (email, password) => {
    setError(null);

    if (!isSupabaseConfigured) {
      // Mock auth
      const mockUser = { id: "local_user", email, user_metadata: { full_name: email.split("@")[0] } };
      setUser(mockUser);
      localStorage.setItem("mock_user", JSON.stringify(mockUser));
      return { user: mockUser };
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    return data;
  }, [isSupabaseConfigured]);

  // -----------------------------------------------------------------------
  // Sign up with email + password
  // -----------------------------------------------------------------------
  const signUp = useCallback(async (email, password) => {
    setError(null);

    if (!isSupabaseConfigured) {
      return signInWithEmail(email, password);
    }

    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    return data;
  }, [isSupabaseConfigured, signInWithEmail]);

  // -----------------------------------------------------------------------
  // Sign in with Google OAuth
  // -----------------------------------------------------------------------
  const signInWithGoogle = useCallback(async () => {
    setError(null);

    if (!isSupabaseConfigured) {
      const mockUser = { id: "google_user", email: "user@gmail.com", user_metadata: { full_name: "Google User" } };
      setUser(mockUser);
      localStorage.setItem("mock_user", JSON.stringify(mockUser));
      return { user: mockUser };
    }

    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    return data;
  }, [isSupabaseConfigured]);

  // -----------------------------------------------------------------------
  // Sign out
  // -----------------------------------------------------------------------
  const signOut = useCallback(async () => {
    setError(null);

    if (!isSupabaseConfigured) {
      setUser(null);
      localStorage.removeItem("mock_user");
      return;
    }

    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    setUser(null);
    setSession(null);
  }, [isSupabaseConfigured]);

  // -----------------------------------------------------------------------
  // Derived helpers
  // -----------------------------------------------------------------------
  const userId = user?.id || "default_user";
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const value = {
    user,
    session,
    loading,
    error,
    userId,
    userEmail,
    userName,
    isAuthenticated: !!user,
    isSupabaseConfigured,
    signInWithEmail,
    signUp,
    signInWithGoogle,
    signOut,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
