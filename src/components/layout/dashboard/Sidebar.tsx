"use client";

import { User } from "@supabase/supabase-js";
import { useLocale } from "next-intl";
import SidebarNav from "./SidebarNav";
import SidebarUserSection from "./SidebarUserSection";

interface SidebarProps {
  isAuthenticated: boolean;
  user?: User | null;
  signOut?: () => Promise<void>;
}

export default function Sidebar({ isAuthenticated, user, signOut }: SidebarProps) {
  const locale = useLocale();

  return (
    <aside className="glass-sidebar hidden h-full w-64 flex-col lg:flex">
      <SidebarNav isAuthenticated={isAuthenticated} currentUserId={user?.id} />

      {/* User section at bottom — authenticated only */}
      {isAuthenticated && user && signOut && (
        <SidebarUserSection user={user} signOut={signOut} locale={locale} />
      )}
    </aside>
  );
}
