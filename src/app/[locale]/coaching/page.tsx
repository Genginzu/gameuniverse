import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoachingHubContent } from "@/components/coaching/CoachingHubContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coaching.hub" });
  return { title: t("title"), description: t("subtitle") };
}

export default function CoachingHubPage() {
  return (
    <EditorialShell>
      <div className="editorial-coaching">
        <CoachingHubContent />
      </div>
    </EditorialShell>
  );
}
