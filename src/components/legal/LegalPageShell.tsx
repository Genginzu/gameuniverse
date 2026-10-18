import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";

interface LegalPageShellProps {
  locale: string;
  title: string;
  /** ISO date string used for the "last updated" line. */
  updatedAt: string;
  children: ReactNode;
}

/**
 * Shared shell for static legal documents (legal notice, privacy, cookies,
 * terms). Renders a semantic <article> with a single <h1>, an "updated at"
 * line and editorial-tokenised long-form styling (no `prose` plugin available).
 */
export async function LegalPageShell({ locale, title, updatedAt, children }: LegalPageShellProps) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(updatedAt));

  return (
    <EditorialShell>
      <article
        lang={locale}
        className="mx-auto w-full max-w-3xl px-6 py-10 text-editorial-muted sm:px-8 sm:py-14 [&_a]:text-editorial-accent [&_a]:underline [&_a:hover]:opacity-80 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-white [&_li]:mb-1 [&_p]:mb-4 [&_p]:leading-relaxed [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-editorial-line [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-editorial-line [&_th]:p-2 [&_th]:text-left [&_th]:text-white [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
      >
        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-editorial-muted">
          {t("lastUpdated", { date: formattedDate })}
        </p>
        <div className="mt-8">{children}</div>
      </article>
    </EditorialShell>
  );
}
