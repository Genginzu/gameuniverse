"use client";

import React, { useState } from "react";
import { Skeleton } from "../../ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useSearchOverlay } from "@/hooks/useSearchOverlay";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import MobileHamburgerButton from "./MobileHamburgerButton";
import MobileNavOverlay from "./MobileNavOverlay";
import dynamic from "next/dynamic";

const SearchOverlay = dynamic(() => import("./SearchOverlay"), { ssr: false });
import { PageBanner } from "@/components/shared/PageBanner";
import Footer from "@/components/shared/Footer";
import { DashboardContext } from "@/hooks/useDashboard";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isOpen: searchOpen, open: openSearch, close: closeSearch } = useSearchOverlay();

  const isAuthenticated = !loading && !!user;

  if (loading) {
    return (
      <div className="dashboard-bg flex h-screen flex-col">
        {/* Top bar skeleton */}
        <div className="glass-header flex h-14 items-center justify-between px-4">
          <Skeleton className="h-8 w-32 rounded-lg bg-white/10" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
            <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          {/* Sidebar skeleton */}
          <div className="hidden w-[220px] shrink-0 border-r border-white/10 bg-white/5 p-4 lg:block">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg bg-white/10" />
              ))}
            </div>
          </div>
          {/* Main content skeleton */}
          <div className="flex-1 p-6">
            <Skeleton className="mb-4 h-8 w-48 rounded-lg bg-white/10" />
            <Skeleton className="mb-2 h-4 w-full rounded bg-white/10" />
            <Skeleton className="mb-2 h-4 w-3/4 rounded bg-white/10" />
            <Skeleton className="h-4 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const contextValue = user ? { user, loading } : null;

  const content = (
    <div className="dashboard-bg flex h-screen flex-col">
      {/* Top bar with logo, search, login */}
      <TopBar isAuthenticated={isAuthenticated} onSearchOpen={openSearch} />

      {/* Sidebar + main content below the top bar */}
      <div className="flex min-h-0 flex-1">
        <Sidebar isAuthenticated={isAuthenticated} user={user} signOut={signOut} />
        <MobileHamburgerButton onClick={() => setMobileNavOpen(true)} />
        <MobileNavOverlay
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onSearchOpen={openSearch}
          isAuthenticated={isAuthenticated}
          currentUserId={user?.id}
        />
        <SearchOverlay isOpen={searchOpen} onClose={closeSearch} />
        <main className="animate-page-enter flex-1 overflow-y-auto">
          <PageBanner />
          <div className="flex min-h-full flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );

  if (contextValue) {
    return <DashboardContext.Provider value={contextValue}>{content}</DashboardContext.Provider>;
  }

  return content;
}
