"use client";

import { useEffect } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FaDice, FaMask, FaUserFriends, FaUsers } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

/**
 * Home page content — redirects authenticated users to dashboard,
 * shows a welcome/explore page for visitors.
 */
export function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("landing");
  const tNav = useTranslations("navigation");
  const isAuthenticated = !loading && !!user;

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/profile");
    }
  }, [isAuthenticated, router]);

  // Authenticated users will be redirected
  if (isAuthenticated) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      {/* Welcome header */}
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="neon-text mb-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      {/* Explore cards */}
      <div className="mx-auto mb-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <ExploreCard
          href="/games"
          icon={FaDice}
          label={tNav("games")}
          colorClass="text-neon-violet"
          bgClass="bg-neon-violet/10 dark:bg-neon-violet/15"
        />
        <ExploreCard
          href="/characters"
          icon={FaMask}
          label={tNav("characters")}
          colorClass="text-neon-cyan"
          bgClass="bg-neon-cyan/10 dark:bg-neon-cyan/15"
        />
        <ExploreCard
          href="/players"
          icon={FaUserFriends}
          label={tNav("players")}
          colorClass="text-neon-magenta"
          bgClass="bg-neon-magenta/10 dark:bg-neon-magenta/15"
        />
      </div>

      {/* CTA */}
      <div className="mx-auto max-w-md text-center">
        <Link
          href="/auth?mode=signup"
          className="neon-btn inline-flex items-center rounded-xl bg-gradient-to-r from-neon-violet/20 to-neon-cyan/20 px-6 py-3 font-semibold text-gray-900 transition-all duration-200 hover:from-neon-violet/30 hover:to-neon-cyan/30 dark:text-white"
        >
          <FaUsers className="mr-3 h-5 w-5 text-neon-violet" />
          {t("cta.signup")}
        </Link>
      </div>
    </div>
  );
}

function ExploreCard({
  href,
  icon: Icon,
  label,
  colorClass,
  bgClass,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <Link
      href={href}
      className="glass-card group flex flex-col items-center rounded-2xl p-6 text-center transition-all duration-200 hover:scale-[1.02]"
    >
      <div className={`mb-3 rounded-xl ${bgClass} p-3`}>
        <Icon className={`h-6 w-6 ${colorClass} drop-shadow-[0_0_6px_currentColor]`} />
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
    </Link>
  );
}
