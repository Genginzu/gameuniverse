import { useTranslations } from "next-intl";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  const t = useTranslations("landing");

  return (
    <>
      <Navigation />
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-center">
          <h1 className="mb-8 text-center text-4xl font-bold">{t("title")}</h1>
          <p className="mb-8 text-center text-lg text-muted-foreground">{t("subtitle")}</p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <h3 className="mb-2 text-xl font-semibold">{t("features.library.title")}</h3>
              <p className="text-muted-foreground">{t("features.library.description")}</p>
            </div>

            <div className="rounded-lg border p-6 text-center">
              <h3 className="mb-2 text-xl font-semibold">{t("features.search.title")}</h3>
              <p className="text-muted-foreground">{t("features.search.description")}</p>
            </div>

            <div className="rounded-lg border p-6 text-center">
              <h3 className="mb-2 text-xl font-semibold">{t("features.details.title")}</h3>
              <p className="text-muted-foreground">{t("features.details.description")}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Next.js 16 + TypeScript + Tailwind CSS + Bun + next-intl
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
