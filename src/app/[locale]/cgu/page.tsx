import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { CguContent } from "@/components/legal/CguContent";

const UPDATED_AT = "2026-09-19";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return { title: t("cgu") };
}

export default async function CguPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <LegalPageShell locale={locale} title={t("cgu")} updatedAt={UPDATED_AT}>
      <CguContent locale={locale} />
    </LegalPageShell>
  );
}
