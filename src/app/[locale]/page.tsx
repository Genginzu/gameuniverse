"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import LandingLayout from "@/components/layout/landing/LandingLayout";
import { LandingContent } from "@/components/landing/LandingContent";

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
        <div className="rounded-xl p-8 backdrop-blur-sm">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // If user is authenticated, don't render landing page (will redirect)
  if (user) {
    return null;
  }

  return (
    <LandingLayout>
      <LandingContent />
    </LandingLayout>
  );
}
