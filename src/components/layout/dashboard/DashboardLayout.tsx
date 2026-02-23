"use client";

import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "../../ui/loading-spinner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSearchOverlay } from "@/hooks/useSearchOverlay";
import Sidebar from "./Sidebar";
import MobileHamburgerButton from "./MobileHamburgerButton";
import MobileNavOverlay from "./MobileNavOverlay";
import SearchOverlay from "./SearchOverlay";
import { DashboardContext } from "@/hooks/useDashboard";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isOpen: searchOpen, open: openSearch, close: closeSearch } = useSearchOverlay();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth?mode=signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="dashboard-bg flex min-h-screen items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const contextValue = {
    user,
    loading,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="dashboard-bg flex h-screen">
        <Sidebar user={user} signOut={signOut} onSearchOpen={openSearch} />
        <MobileHamburgerButton onClick={() => setMobileNavOpen(true)} />
        <MobileNavOverlay
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onSearchOpen={openSearch}
        />
        <SearchOverlay isOpen={searchOpen} onClose={closeSearch} />
        <main className="animate-page-enter flex-1 overflow-y-auto">{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}
