"use client";

import { User } from "@supabase/supabase-js";
import { useLocale } from "next-intl";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import SidebarNav from "./SidebarNav";
import SidebarSearchButton from "./SidebarSearchButton";
import SidebarUserSection from "./SidebarUserSection";

interface SidebarProps {
  user: User;
  signOut: () => Promise<void>;
  onSearchOpen: () => void;
}

export default function Sidebar({ user, signOut, onSearchOpen }: SidebarProps) {
  const locale = useLocale();

  return (
    <aside className="glass-sidebar hidden h-screen w-64 flex-col border-r border-neon-violet/20 shadow-[1px_0_15px_rgb(var(--neon-violet)/0.15)] lg:flex">
      {/* Logo + App name */}
      <div className="flex items-center gap-3 px-5 py-5">
        <GameUniverseLogo size="sm" />
        <span className="text-lg font-bold tracking-wide text-gray-900 dark:text-white">
          Game Universe
        </span>
      </div>

      {/* Search button */}
      <SidebarSearchButton onClick={onSearchOpen} />

      {/* Navigation links (flex-1 to fill middle space) */}
      <SidebarNav />

      {/* User section at bottom */}
      <SidebarUserSection user={user} signOut={signOut} locale={locale} />
    </aside>
  );
}
