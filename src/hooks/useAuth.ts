"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
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

  // Use refs to avoid re-running the effect when router/supabase change reference
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          // Si c'est une erreur de token, nettoyer l'état
          if (error.message?.includes("refresh") || error.message?.includes("token")) {
            clearAuthCookies();
            await supabase.auth.signOut();
          }
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      } catch (error) {
        if (!mounted) return;

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
        // Gérer les erreurs de token
        if (event === "TOKEN_REFRESHED" && !session) {
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
          // mais PAS si on est sur la page de reset password
          const currentPath = window.location.pathname;
          const isResetPasswordPage = currentPath.includes("/reset-password");
          if (!isResetPasswordPage && (currentPath.includes("/auth") || currentPath === "/")) {
            routerRef.current.push("/profile");
          }
        } else if (event === "SIGNED_OUT") {
          routerRef.current.push("/");
        }
      });
      subscription = sub;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("refresh") || error.message.includes("token"))
      ) {
        clearAuthCookies();
      }
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
    // supabase is a singleton, router ref is used via routerRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: fullName || "",
          preferred_locale: preferredLocale || "fr",
        },
        emailRedirectTo: `${redirectUrl}/api/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    try {
      // Appeler d'abord signOut de Supabase
      await supabase.auth.signOut();

      // Ignorer les erreurs de signOut — on nettoie quand même

      // Nettoyer les cookies locaux
      clearAuthCookies();
    } catch {
      // Erreur ignorée — le nettoyage continue ci-dessous
    }

    // Forcer la mise à jour de l'état même en cas d'erreur
    setAuthState({
      user: null,
      session: null,
      loading: false,
    });

    // Rediriger vers la page d'accueil
    router.push("/");
  };

  const forceSignOut = async () => {
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
