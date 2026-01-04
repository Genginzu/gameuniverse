"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="rounded-lg bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <div className="text-lg font-medium text-gray-700">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't render landing page (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <LandingPage />
    </>
  );
}
