"use client";

/**
 * DashboardEditorial : hub personnel de l'utilisateur connecté (`/dashboard`)
 * au look éditorial (refonte Phase 2).
 *
 * Page de référence du standard éditorial « Tailwind inline + tokens @theme » :
 * surfaces sombres via les utilities `bg-editorial-*` / `text-editorial-*`,
 * accent dynamique `*-editorial-accent`, pas de CSS module ni de glassmorphism.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { useUserLibrary } from "@/hooks/useUserLibrary";

interface DashboardEditorialProps {
  /** Infos utilisateur résolues server-side (évite le flash de chargement). */
  user: { id: string; email: string; username: string; createdAt: string };
}

const QUICK_ACTIONS = [
  { href: "/library", icon: "lucide:library-big", labelKey: "library" },
  { href: "/collections", icon: "lucide:folder-heart", labelKey: "collections" },
  { href: "/favorites/characters", icon: "lucide:star", labelKey: "myCharacters" },
] as const;

export function DashboardEditorial({ user }: DashboardEditorialProps) {
  const t = useTranslations("dashboard");
  const { stats, loading } = useUserLibrary();

  const completedPercent =
    stats.totalGames > 0 ? Math.round((stats.completedGames / stats.totalGames) * 100) : 0;
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <section className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
      {/* Hero */}
      <header className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
        <div>
          <KickerLabel>{t("editorial.kicker")}</KickerLabel>
          <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t.rich("welcome", {
              name: () => <span className="text-editorial-accent">{user.username}</span>,
            })}
          </h1>
          <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">{t("subtitle")}</p>
        </div>

        <div className="border-editorial-line grid grid-cols-3 gap-6 border-t border-b py-6">
          <Stat label={t("editorial.statGames")} value={loading ? "—" : String(stats.totalGames)} />
          <Stat
            label={t("editorial.statCompleted")}
            value={
              loading ? (
                "—"
              ) : (
                <>
                  {stats.completedGames}
                  <Suffix> · {completedPercent}%</Suffix>
                </>
              )
            }
          />
          <Stat
            label={t("editorial.statPlaytime")}
            value={loading ? "—" : <>{stats.totalPlayTime}<Suffix>h</Suffix></>}
            accent
          />
        </div>
      </header>

      {/* Accès rapides */}
      <section className="mt-10">
        <KickerLabel as="h2" className="mb-4">
          {t("quickActions")}
        </KickerLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickAction
              key={action.href}
              href={action.href}
              icon={action.icon}
              label={t(action.labelKey)}
            />
          ))}
          <QuickAction
            href={`/players/${user.id}`}
            icon="lucide:user-round"
            label={t("profile")}
          />
        </div>
      </section>

      {/* Infos compte */}
      <section className="mt-10">
        <KickerLabel as="h2" className="mb-4">
          {t("accountInfo")}
        </KickerLabel>
        <div className="border-editorial-line bg-editorial-2 overflow-hidden rounded-2xl border">
          <AccountRow label={t("email")} value={user.email} />
          <AccountRow label={t("memberSince")} value={memberSince} />
          <AccountRow label={t("accountStatus")} value={t("active")} accent />
        </div>
      </section>
    </section>
  );
}

function Suffix({ children }: { children: ReactNode }) {
  return <span className="text-sm font-light text-white/40">{children}</span>;
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-3xl leading-none font-bold tracking-tight ${
          accent ? "text-editorial-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="group border-editorial-line bg-editorial-2 hover:border-editorial-accent hover:bg-editorial-3 flex min-h-[44px] items-center gap-3.5 rounded-2xl border p-5 text-white transition-all duration-200 hover:-translate-y-0.5"
    >
      <span className="bg-editorial-accent/15 text-editorial-accent grid size-10 shrink-0 place-items-center rounded-xl">
        <Icon icon={icon} className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 font-semibold">{label}</span>
      <Icon
        icon="mdi:arrow-top-right"
        className="text-editorial-muted group-hover:text-editorial-accent size-4 transition-colors"
        aria-hidden
      />
    </Link>
  );
}

function AccountRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-editorial-line flex flex-wrap items-center justify-between gap-2 px-5 py-4 not-first:border-t">
      <span className="text-editorial-muted text-sm">{label}</span>
      <span className={`font-semibold break-all ${accent ? "text-editorial-accent" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
