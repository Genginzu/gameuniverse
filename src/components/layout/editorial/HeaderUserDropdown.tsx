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

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { useEditorialNavigation } from "@/hooks/useEditorialNavigation";

interface HeaderUserDropdownProps {
  className?: string;
}

export function HeaderUserDropdown({ className = "" }: HeaderUserDropdownProps) {
  const t = useTranslations("header.userDropdown");
  const { user, loading, signOut } = useAuth();
  const { account } = useEditorialNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  // Escape or a pointer down outside closes; the focus returns to the trigger.
  useDismissableLayer(containerRef, { open: isOpen, onDismiss: () => setIsOpen(false) });

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
    (typeof user?.user_metadata?.username === "string" ? user.user_metadata.username : null) ??
    user?.email ??
    "";
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
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
          <img src={avatarUrl} alt={t("avatarAlt", { username })} className="header-user-avatar" />
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
            {account.map((link) => (
              <Link
                key={link.href}
                role="menuitem"
                href={link.href}
                className={`header-user-menu-item ${link.isActive ? "is-active" : ""}`.trim()}
                onClick={() => setIsOpen(false)}
                data-testid={`header-user-menu-${link.key}`}
              >
                <Icon icon={link.icon} className="size-4" aria-hidden />
                <span>{link.label}</span>
              </Link>
            ))}
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
