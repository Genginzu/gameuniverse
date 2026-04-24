"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { NAV_LINKS, PUBLIC_LINKS, COACHING_LINKS, isActive } from "@/lib/utils/navigation-utils";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import UnreadBadge from "@/components/discussions/UnreadBadge";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";

interface SidebarNavProps {
  isAuthenticated?: boolean;
  currentUserId?: string;
  onLinkClick?: () => void;
}

export default function SidebarNav({
  isAuthenticated = false,
  currentUserId,
  onLinkClick,
}: SidebarNavProps) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const pathname = usePathname();
  const { count: unreadCount } = useUnreadCount();
  const { data: pendingData } = useSWR<{ count: number }>(
    isAuthenticated ? "/api/coaching/sessions/pending-count" : null, fetcher, { refreshInterval: 30000 }
  );
  const pendingCount = pendingData?.count ?? 0;

  const linkClasses = (active: boolean) =>
    `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-neon-violet/60 focus:ring-offset-1 focus:ring-offset-transparent motion-safe:transition-all motion-safe:duration-200 ${
      active
        ? "border-l-2 border-neon-violet bg-neon-violet/10 text-neon-violet shadow-[0_0_8px_rgb(var(--neon-violet)/0.6)]"
        : "border-l-2 border-transparent text-gray-700 motion-safe:hover:bg-black/5 motion-safe:hover:text-gray-900 dark:text-gray-400 dark:motion-safe:hover:bg-white/10 dark:motion-safe:hover:text-white"
    }`;

  const iconClasses = (active: boolean) =>
    `mr-3 h-4 w-4 motion-safe:transition-all motion-safe:duration-200 ${
      active
        ? "drop-shadow-[0_0_6px_rgb(var(--neon-violet)/0.6)]"
        : "motion-safe:group-hover:drop-shadow-[0_0_4px_rgb(var(--neon-violet)/0.4)]"
    }`;

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4 pt-4" aria-label="Main navigation">
      {/* Category: Explorer */}
      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
        {tNav("explore")}
      </p>
      {PUBLIC_LINKS.map(({ href, icon, labelKey }) => {
        const active = isActive(pathname, href, currentUserId);
        return (
          <Link key={href} href={href} onClick={onLinkClick} className={linkClasses(active)}>
            <Icon icon={icon} className={iconClasses(active)} />
            <span>{tNav(labelKey)}</span>
          </Link>
        );
      })}

      {/* Category: Mon espace — authenticated only */}
      {isAuthenticated && (
        <>
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
            {t("mySpace")}
          </p>
          {NAV_LINKS.map(({ href, icon, labelKey }) => {
            const active = isActive(pathname, href, currentUserId);
            return (
              <Link key={href} href={href} onClick={onLinkClick} className={linkClasses(active)}>
                <Icon icon={icon} className={iconClasses(active)} />
                <span>{t(labelKey)}</span>
                {href === "/discussions" && <UnreadBadge count={unreadCount} />}
              </Link>
            );
          })}

          {/* Category: Coaching */}
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
            {tNav("coaching")}
          </p>
          {COACHING_LINKS.map(({ href, icon, labelKey }) => {
            const active = isActive(pathname, href, currentUserId);
            return (
              <Link key={href} href={href} onClick={onLinkClick} className={linkClasses(active)}>
                <Icon icon={icon} className={iconClasses(active)} />
                <span>{tNav(labelKey)}</span>
                {href === "/coaching/sessions" && pendingCount > 0 && <UnreadBadge count={pendingCount} />}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}
