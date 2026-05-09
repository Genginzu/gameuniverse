/**
 * Header simple du POC : nav minimal style Imba (logo gauche, nav centrée,
 * actions à droite). Ne reproduit pas la nav du site existant.
 */

import Link from "next/link";

interface PocHeaderProps {
  locale: string;
  pageLabel?: string;
}

export function PocHeader({ locale, pageLabel }: PocHeaderProps) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-6 lg:px-12">
      <Link
        href={`/${locale}/design-poc`}
        className="poc-display flex items-center gap-2 text-2xl tracking-tight"
      >
        <span className="text-white">G</span>
        <span className="text-[var(--poc-accent-400)]">·</span>
        <span className="text-white">U</span>
      </Link>

      <nav className="hidden items-center gap-8 text-sm text-zinc-300 lg:flex">
        <Link
          href={`/${locale}/design-poc/home`}
          className="hover:text-white transition-colors"
        >
          Home
        </Link>
        <Link
          href={`/${locale}/design-poc/game`}
          className="hover:text-white transition-colors"
        >
          Game
        </Link>
        <Link
          href={`/${locale}/design-poc/player`}
          className="hover:text-white transition-colors"
        >
          Player
        </Link>
        <span className="text-zinc-600">·</span>
        <Link
          href={`/${locale}/design-poc`}
          className="hover:text-white transition-colors"
        >
          Index POC
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        {pageLabel && (
          <span className="poc-kicker hidden md:inline-block">{pageLabel}</span>
        )}
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          aria-label="Search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
