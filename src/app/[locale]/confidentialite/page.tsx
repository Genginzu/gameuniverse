import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ConfidentialiteContent } from "@/components/legal/ConfidentialiteContent";

const UPDATED_AT = "2026-10-20";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return { title: t("confidentialite") };
}

export default async function ConfidentialitePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <LegalPageShell locale={locale} title={t("confidentialite")} updatedAt={UPDATED_AT}>
      <ConfidentialiteContent locale={locale} />
    </LegalPageShell>
  );
}
