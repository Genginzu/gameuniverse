"use client";

import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !user) {
          router.push("/auth?mode=signin");
        }
      }, [user, loading, router]);

      if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

    return <DashboardContent user={user} signout />;
}
