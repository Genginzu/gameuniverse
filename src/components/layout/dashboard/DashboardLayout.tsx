"use client";

import React, { useEffect } from "react";
import { LoadingSpinner } from "../../ui/loading-spinner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import { DashboardContext } from "@/hooks/useDashboard";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
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

  const contextValue = {
    user,
    loading,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <DashboardHeader />
        {/* Sidebar Area */}
        <div className="flex flex-1">
          <DashboardSidebar signOut={signOut} user={user} />
          {/* Main Content */}
          <div className="flex flex-1 flex-col">
            {/* <DashboardBreadcrumb /> */}
            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
