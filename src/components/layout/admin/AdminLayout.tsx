"use client";

import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "../../ui/loading-spinner";
import { useRouter } from "@/i18n/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminSidebar";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";


interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { user: adminUser, loading: adminLoading, canRead } = useAdminAuth();
  const router = useRouter();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loading = authLoading || adminLoading;

  // Prevent body scroll in admin layout — all scrolling happens inside <main>
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !authUser) {
      router.push("/auth?mode=signin");
    }
  }, [authUser, loading, router]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("admin-mobile-sidebar");
      const toggle = document.getElementById("admin-sidebar-toggle");
      if (
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggle &&
        !toggle.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  // Close sidebar on resize/orientation change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3 rounded-lg p-8">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null; // Will redirect
  }

  // Authenticated but not authorized (not admin/contributor)
  if (!canRead) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">403</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t("forbidden")}</p>
          <Button className="mt-4" onClick={() => router.push("/profile")}>
            {t("backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <Button
        id="admin-sidebar-toggle"
        variant="ghost"
        size="sm"
        className="fixed left-4 top-4 z-30 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <Icon icon="fa:times" className="h-5 w-5"  /> : <Icon icon="fa:bars" className="h-5 w-5"  />}
      </Button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" />}

      {adminUser && (
        <AdminSidebar
          user={adminUser}
          signOut={signOut}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-end border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <LanguageSwitcher />
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
    </div>
  );
}
