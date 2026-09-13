"use client";

/**
 * FriendsPageContent : page dédiée `/friends` au look éditorial.
 *
 * Affiche les amis de l'utilisateur courant en réutilisant `FriendsTab`.
 * Gère l'état de chargement d'auth et le cas non-connecté.
 */

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { useAuth } from "@/hooks/useAuth";

import { FriendsTab } from "./FriendsTab";

export function FriendsPageContent() {
  const t = useTranslations("friends.page");
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        {/* Hero */}
        <header className="mb-10">
          <KickerLabel>{t("title")}</KickerLabel>
          <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">{t("subtitle")}</p>
        </header>

        {/* Content */}
        {authLoading ? null : !user ? (
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-4 rounded-3xl border px-8 py-16 text-center">
            <h2 className="font-display text-2xl font-bold text-white">
              {t("authRequired.title")}
            </h2>
            <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
            <Button asChild>
              <Link href="/auth">{t("authRequired.signIn")}</Link>
            </Button>
          </div>
        ) : (
          <FriendsTab playerId={user.id} locale={locale} />
        )}
      </div>
    </section>
  );
}
