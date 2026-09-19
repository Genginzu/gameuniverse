import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { CgvContent } from "@/components/legal/CgvContent";

const UPDATED_AT = "2026-09-19";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return { title: t("cgv") };
}

export default async function CgvPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <LegalPageShell locale={locale} title={t("cgv")} updatedAt={UPDATED_AT}>
      <CgvContent locale={locale} />
    </LegalPageShell>
  );
}
