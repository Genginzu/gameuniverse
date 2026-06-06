"use client";

import { GameUniverseLogo } from "@/components/ui/game-universe-logo";

export function AuthLoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-editorial-bg text-white">
      <header className="border-b border-editorial-line">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <GameUniverseLogo size="md" />
            <span className="font-display text-lg font-bold tracking-wide text-white sm:text-xl">
              Gamers Universe
            </span>
          </div>
          <div className="h-9 w-20 animate-pulse rounded-lg bg-white/[0.06]" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-md rounded-2xl border border-editorial-line bg-editorial-2 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-white/[0.08]" />
              <div className="mx-auto h-5 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
            </div>
            <div className="space-y-5">
              <div className="h-12 animate-pulse rounded-xl bg-white/[0.06]" />
              <div className="h-12 animate-pulse rounded-xl bg-white/[0.06]" />
              <div className="h-12 animate-pulse rounded-xl bg-white/[0.08]" />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-editorial-line px-4 py-6 text-center text-xs text-editorial-muted sm:px-6">
        © {new Date().getFullYear()} Gamers Universe
      </footer>
    </div>
  );
}
