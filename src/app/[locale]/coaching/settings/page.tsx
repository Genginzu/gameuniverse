import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoachSettingsContent } from "@/components/coaching/CoachSettingsContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coaching" });
  return { title: t("settings.title") };
}

export default function CoachSettingsPage() {
  return (
    <EditorialShell>
      <div className="editorial-coaching">
        <CoachSettingsContent />
      </div>
    </EditorialShell>
  );
}
