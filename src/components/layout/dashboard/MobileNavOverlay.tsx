"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FaSearch, FaTimes, FaSignInAlt } from "react-icons/fa";
import { NAV_LINKS, PUBLIC_LINKS, isActive } from "@/lib/utils/navigation-utils";

interface MobileNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
  isAuthenticated?: boolean;
  currentUserId?: string;
}

export default function MobileNavOverlay({
  isOpen,
  onClose,
  onSearchOpen,
  isAuthenticated = true,
  currentUserId,
}: MobileNavOverlayProps) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const pathname = usePathname();

  if (!isOpen) return null;

  const handleSearchClick = () => {
    onSearchOpen();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm lg:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      <nav
        className="glass relative mx-4 w-full max-w-sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:text-white motion-safe:transition-colors motion-safe:duration-200"
          aria-label="Close navigation"
        >
          <FaTimes className="h-5 w-5" />
        </button>

        {/* Search button */}
        <button
          onClick={handleSearchClick}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white motion-safe:transition-all motion-safe:duration-200"
        >
          <FaSearch className="h-5 w-5" />
          <span>{t("search")}</span>
        </button>

        {/* Category: Explorer */}
        <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {tNav("explore")}
        </p>
        <ul className="flex flex-col gap-2">
          {PUBLIC_LINKS.map(({ href, icon: Icon, labelKey }) => {
            const active = isActive(pathname, href, currentUserId);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium motion-safe:transition-all motion-safe:duration-200 ${
                    active
                      ? "bg-neon-violet/10 text-neon-violet shadow-[0_0_12px_rgb(var(--neon-violet)/0.3)]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_rgb(var(--neon-violet)/0.6)]" : ""}`}
                  />
                  <span>{tNav(labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Category: Mon espace — only for authenticated users */}
        {isAuthenticated && (
          <>
            <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("mySpace")}
            </p>
            <ul className="flex flex-col gap-2">
              {NAV_LINKS.map(({ href, icon: Icon, labelKey }) => {
                const active = isActive(pathname, href, currentUserId);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium motion-safe:transition-all motion-safe:duration-200 ${
                        active
                          ? "bg-neon-violet/10 text-neon-violet shadow-[0_0_12px_rgb(var(--neon-violet)/0.3)]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_rgb(var(--neon-violet)/0.6)]" : ""}`}
                      />
                      <span>{t(labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* Sign-in link for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <Link
              href="/auth?mode=signin"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-neon-violet transition-all hover:bg-neon-violet/10"
            >
              <FaSignInAlt className="h-5 w-5" />
              <span>{tNav("login")}</span>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
