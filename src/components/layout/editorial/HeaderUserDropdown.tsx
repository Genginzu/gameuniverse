"use client";

/**
 * HeaderUserDropdown : dropdown utilisateur compact dans le header éditorial
 * (slot `userSlot` de `EditorialMegaMenu`).
 *
 * Connecté :
 *   [Avatar 32px] [chevron]
 *     ↓ clic
 *   ┌────────────────┐
 *   │ Profile        │
 *   │ Library        │
 *   │ Settings       │
 *   │ ───────────── │
 *   │ Sign out       │
 *   └────────────────┘
 *
 * Non connecté : bouton "Sign in" qui pointe vers /auth.
 *
 * Voir docs/design/editorial-refonte-plan.md (issue #264).
 */

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";

interface HeaderUserDropdownProps {
  className?: string;
}

interface MenuLink {
  href: string;
  labelKey: string;
  icon: string;
}

const MENU_LINKS: readonly MenuLink[] = [
  { href: "/profile", labelKey: "profile", icon: "lucide:user" },
  { href: "/library", labelKey: "library", icon: "lucide:library" },
  { href: "/settings", labelKey: "settings", icon: "lucide:settings" },
];

export function HeaderUserDropdown({ className = "" }: HeaderUserDropdownProps) {
  const t = useTranslations("header.userDropdown");
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  // ----------------------------------------------------------------------
  // Close on outside click
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // ----------------------------------------------------------------------
  // Close on Escape
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // ----------------------------------------------------------------------
  // Sign in button (not authenticated)
  // ----------------------------------------------------------------------
  if (!loading && !user) {
    return (
      <Link
        href="/auth"
        className={`header-user-signin ${className}`.trim()}
        data-testid="header-user-signin"
      >
        <Icon icon="lucide:log-in" className="size-4" aria-hidden />
        <span>{t("signIn")}</span>
      </Link>
    );
  }

  // While loading, render a placeholder (avoids layout shift when auth resolves)
  if (loading) {
    return (
      <div
        className={`header-user-placeholder ${className}`.trim()}
        aria-hidden
        data-testid="header-user-placeholder"
      />
    );
  }

  // ----------------------------------------------------------------------
  // Authenticated user
  // ----------------------------------------------------------------------
  const username =
    (typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : null) ??
    user?.email ??
    "";
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const initial = username.trim().charAt(0).toUpperCase() || "?";

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div
      ref={containerRef}
      className={`header-user-dropdown ${className}`.trim()}
      data-testid="header-user-dropdown"
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={t("dropdownAriaLabel")}
        className="header-user-trigger"
        data-testid="header-user-trigger"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={t("avatarAlt", { username })}
            className="header-user-avatar"
          />
        ) : (
          <span className="header-user-avatar header-user-avatar-fallback" aria-hidden>
            {initial}
          </span>
        )}
        <Icon
          icon="mdi:chevron-down"
          className={`header-user-chevron ${isOpen ? "is-open" : ""}`.trim()}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="menu"
          aria-label={t("dropdownAriaLabel")}
          className="header-user-menu"
          data-testid="header-user-menu"
        >
          <div className="header-user-menu-header">
            <span className="header-user-menu-username">{username}</span>
          </div>

          <div className="header-user-menu-section">
            {MENU_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  role="menuitem"
                  href={link.href}
                  className={`header-user-menu-item ${isActive ? "is-active" : ""}`.trim()}
                  onClick={() => setIsOpen(false)}
                  data-testid={`header-user-menu-${link.labelKey}`}
                >
                  <Icon icon={link.icon} className="size-4" aria-hidden />
                  <span>{t(link.labelKey)}</span>
                </Link>
              );
            })}
          </div>

          <div className="header-user-menu-divider" aria-hidden />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="header-user-menu-item header-user-menu-item-danger"
            data-testid="header-user-menu-signout"
          >
            <Icon icon="lucide:log-out" className="size-4" aria-hidden />
            <span>{t("signOut")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
