"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { clearAuthCookies } from "@/lib/auth-utils";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.warn("🔍 Getting initial session...");

        // Timeout de 5 secondes pour éviter le blocage
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Supabase connection timeout"));
          }, 5000);
        });

        const sessionPromise = supabase.auth.getSession();

        const result = (await Promise.race([sessionPromise, timeoutPromise])) as {
          data: { session: Session | null };
          error: Error | null;
        };
        clearTimeout(timeoutId);

        const {
          data: { session },
          error,
        } = result;

        if (error) {
          console.error("❌ Error getting session:", error);
          // Si c'est une erreur de token, nettoyer l'état
          if (error.message?.includes("refresh") || error.message?.includes("token")) {
            clearAuthCookies();
            await supabase.auth.signOut();
          }
        } else {
          console.warn("✅ Initial session:", session ? "Found" : "None");
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      } catch (error) {
        console.error("❌ Exception getting session (probably Supabase not available):", error);
        clearTimeout(timeoutId);

        // Si c'est une erreur d'authentification, nettoyer
        if (
          error instanceof Error &&
          (error.message.includes("refresh") || error.message.includes("token"))
        ) {
          clearAuthCookies();
        }

        setAuthState({
          user: null,
          session: null,
          loading: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"];
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.warn("🔄 Auth state change:", event, session ? "with session" : "no session");

        // Gérer les erreurs de token
        if (event === "TOKEN_REFRESHED" && !session) {
          console.warn("⚠️ Token refresh failed, clearing auth state");
          clearAuthCookies();
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });

        // Handle auth events
        if (event === "SIGNED_IN") {
          // Ne rediriger vers le dashboard que si on vient d'une page d'authentification
          const currentPath = window.location.pathname;
          if (currentPath.includes("/auth") || currentPath === "/") {
            router.push("/dashboard");
          }
        } else if (event === "SIGNED_OUT") {
          router.push("/");
        }
      });
      subscription = sub;
    } catch (error) {
      console.error("❌ Error setting up auth listener:", error);
      if (
        error instanceof Error &&
        (error.message.includes("refresh") || error.message.includes("token"))
      ) {
        clearAuthCookies();
      }
    }

    return () => {
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    preferredLocale?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
          preferred_locale: preferredLocale || "fr",
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    try {
      // Nettoyer d'abord les cookies locaux
      clearAuthCookies();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn("Error during signOut, but continuing:", error);
      }
    } catch (error) {
      console.warn("Exception during signOut, but continuing:", error);
    }

    // Forcer la mise à jour de l'état même en cas d'erreur
    setAuthState({
      user: null,
      session: null,
      loading: false,
    });
  };

  const forceSignOut = async () => {
    console.warn("🔄 Force sign out - clearing all auth data");
    clearAuthCookies();

    setAuthState({
      user: null,
      session: null,
      loading: false,
    });

    router.push("/auth");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    forceSignOut,
    resetPassword,
  };
}
