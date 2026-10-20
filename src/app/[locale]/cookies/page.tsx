import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LegalDocument } from "@/components/legal/LegalDocument";

const UPDATED_AT = "2026-09-19";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return { title: t("cookies") };
}

export default async function CookiesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <LegalPageShell locale={locale} title={t("cookies")} updatedAt={UPDATED_AT}>
      <LegalDocument locale={locale} page="cookies" />
    </LegalPageShell>
  );
}
