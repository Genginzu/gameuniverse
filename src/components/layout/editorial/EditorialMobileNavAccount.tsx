"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { NavLink } from "@/types/navigation";

interface EditorialMobileNavAccountProps {
  links: NavLink[];
  onNavigate: () => void;
}

/** Account section of the mobile overlay: Account Links + sign out, or sign in. */
export function EditorialMobileNavAccount({ links, onNavigate }: EditorialMobileNavAccountProps) {
  const t = useTranslations("editorial.mobileNav.account");
  const { user, loading, signOut } = useAuth();

  if (loading) return null;

  return (
    <section
      aria-label={t("title")}
      className="editorial-mobile-account"
      data-testid="editorial-mobile-account"
    >
      <h2 className="editorial-mobile-account-title">{t("title")}</h2>

      {user ? (
        <ul className="editorial-mobile-account-list">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={link.isActive ? "page" : undefined}
                className={`editorial-mobile-account-link ${link.isActive ? "is-active" : ""}`.trim()}
                data-testid={`editorial-mobile-account-${link.key}`}
              >
                <Icon icon={link.icon} className="size-4" aria-hidden />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={async () => {
                onNavigate();
                await signOut();
              }}
              className="editorial-mobile-account-link editorial-mobile-account-link-danger"
              data-testid="editorial-mobile-account-signout"
            >
              <Icon icon="lucide:log-out" className="size-4" aria-hidden />
              <span>{t("signOut")}</span>
            </button>
          </li>
        </ul>
      ) : (
        <Link
          href="/auth"
          onClick={onNavigate}
          className="editorial-mobile-account-cta"
          data-testid="editorial-mobile-account-signin"
        >
          <Icon icon="lucide:log-in" className="size-4" aria-hidden />
          <span>{t("signIn")}</span>
        </Link>
      )}
    </section>
  );
}
