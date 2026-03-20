"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function AuthLoadingFallback() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-linear-to-r from-slate-900/5 to-slate-800/5 backdrop-blur-xs"></div>
        <div className="relative flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-slate-900 to-slate-700">
              <span className="text-lg font-bold text-white">G</span>
            </div>
            <div className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold text-transparent">
              Game Universe
            </div>
          </div>
          <div className="h-10 w-24 animate-pulse rounded-2xl bg-slate-200"></div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-6 pt-12">
        <Card className="mx-auto w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-xs">
          <CardHeader className="space-y-6 pb-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto h-8 w-48 animate-pulse rounded-2xl bg-slate-200" />
              <div className="mx-auto h-5 w-64 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Spinner size="lg" className="text-slate-400" />
              <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/20 bg-white/60 p-6 shadow-lg backdrop-blur-xs">
            <div className="mx-auto h-4 w-48 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </footer>
    </div>
  );
}
