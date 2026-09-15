import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { TagsHubContent } from "@/components/posts/TagsHubContent";

interface TagsHubPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TagsHubPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "posts.tags" });
  return {
    title: t("hubMetaTitle"),
    description: t("hubMetaDescription"),
  };
}

export default function TagsHubPage() {
  return (
    <EditorialShell>
      <ErrorBoundary fallback={<ErrorFallback showRefresh showHomeButton />}>
        <TagsHubContent />
      </ErrorBoundary>
    </EditorialShell>
  );
}
