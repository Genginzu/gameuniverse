"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function AuthLoadingFallback() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="relative">
        <div className="absolute inset-0 bg-linear-to-r from-slate-900/5 to-slate-800/5 backdrop-blur-xs dark:from-slate-100/5 dark:to-slate-200/5" />
        <div className="relative flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-slate-900 to-slate-700">
              <span className="text-lg font-bold text-white">G</span>
            </div>
            <div className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold text-transparent dark:from-slate-100 dark:to-slate-300">
              Gamers Universe
            </div>
          </div>
          <div className="h-10 w-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4 pt-8 sm:p-6 sm:pt-12">
        <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs dark:bg-slate-800/95">
          <CardHeader className="space-y-6 pb-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto h-8 w-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
              <div className="mx-auto h-5 w-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700/50" />
            </div>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" className="text-slate-400 dark:text-slate-500" />
              <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-xs dark:border-slate-700/50 dark:bg-slate-800/60">
            <div className="mx-auto h-4 w-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700/50" />
          </div>
        </div>
      </footer>
    </div>
  );
}
