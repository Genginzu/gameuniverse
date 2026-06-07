import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoachingSessionsContent } from "@/components/coaching/CoachingSessionsContent";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coaching.sessions" });
  return { title: t("title") };
}

export default function CoachingSessionsPage() {
  return (
    <EditorialShell>
      <div className="editorial-coaching">
        <CoachingSessionsContent />
      </div>
    </EditorialShell>
  );
}
