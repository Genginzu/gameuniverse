import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { MentionsLegalesContent } from "@/components/legal/MentionsLegalesContent";

const UPDATED_AT = "2026-09-19";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return { title: t("mentionsLegales") };
}

export default async function MentionsLegalesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <LegalPageShell locale={locale} title={t("mentionsLegales")} updatedAt={UPDATED_AT}>
      <MentionsLegalesContent locale={locale} />
    </LegalPageShell>
  );
}
