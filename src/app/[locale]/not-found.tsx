import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-palette-secondary-500 to-palette-primary-500">
          <span className="text-3xl font-bold text-white">404</span>
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          {t("description")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90"
          >
            <Icon icon="mdi:home" className="size-5" />
            {t("home")}
          </Link>
          <Link
            href="/games"
            className="glass-input inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all hover:bg-white/60 dark:hover:bg-slate-700/60"
          >
            <Icon icon="mdi:gamepad-variant" className="size-5" />
            {t("games")}
          </Link>
        </div>
      </div>
    </div>
  );
}
