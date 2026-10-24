import { AuthLayout } from "./AuthLayout";

export function AuthLoadingFallback() {
  return (
    <AuthLayout>
      <div className="border-editorial-line bg-editorial-2 w-full rounded-2xl border p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="space-y-6">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-white/[0.08]" />
            <div className="mx-auto h-5 w-64 max-w-full animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
          <div className="space-y-5">
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.08]" />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
