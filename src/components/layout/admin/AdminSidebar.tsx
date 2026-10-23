"use client";

import { useTranslations } from "next-intl";
import { useRef, type RefObject } from "react";
import { Icon } from "@iconify/react";
import type { AdminUser } from "@/types/admin-auth";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { AdminSidebarNav } from "./AdminSidebarNav";
import { AdminSidebarUserMenu } from "./AdminSidebarUserMenu";

interface AdminSidebarProps {
  user: AdminUser;
  signOut: () => Promise<void>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** The mobile toggle button: an inside region of the mobile drawer. */
  toggleRef?: RefObject<HTMLElement | null>;
}

export default function AdminSidebar({
  user,
  signOut,
  sidebarOpen,
  setSidebarOpen,
  toggleRef,
}: AdminSidebarProps) {
  const t = useTranslations("admin");
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Mobile drawer: Escape or a pointer down outside closes, focus trapped.
  useDismissableLayer(sidebarRef, {
    open: sidebarOpen,
    onDismiss: () => setSidebarOpen(false),
    insideRefs: toggleRef ? [toggleRef] : undefined,
    trapFocus: true,
  });

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const roleBadgeClasses =
    user.role === "admin"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : "bg-palette-primary-100 text-palette-primary-800 dark:bg-palette-primary-900/30 dark:text-palette-primary-400";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("title")}</h2>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClasses}`}
        >
          {t(`roles.${user.role}`)}
        </span>
      </div>
      <AdminSidebarNav onLinkClick={handleLinkClick} />
      <AdminSidebarUserMenu user={user} signOut={signOut} />
    </div>
  );

  return (
    <>
      <div className="hidden h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex dark:border-gray-700 dark:bg-gray-900">
        {sidebarContent}
      </div>
      <div
        id="admin-mobile-sidebar"
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out lg:hidden dark:bg-gray-900 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(false)}
              className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={t("closeSidebar")}
            >
              <Icon icon="fa:times" className="h-5 w-5" />
            </button>
          </div>
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
