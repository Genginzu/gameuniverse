"use client";

import React, { useState } from "react";
import { LoadingSpinner } from "../../ui/loading-spinner";
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
      <div className="dashboard-bg flex min-h-screen items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <LoadingSpinner size="lg" />
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
