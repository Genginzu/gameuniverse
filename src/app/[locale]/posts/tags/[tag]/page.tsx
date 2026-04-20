import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { TagPostsContent } from "@/components/posts/TagPostsContent";

interface TagPostsPageProps {
  params: Promise<{ locale: string; tag: string }>;
}

export async function generateMetadata({ params }: TagPostsPageProps): Promise<Metadata> {
  const { locale, tag } = await params;
  const t = await getTranslations({ locale, namespace: "posts.tags" });
  return {
    title: t("metaTitle", { tag }),
    description: t("metaDescription", { tag }),
  };
}

export default async function TagPostsPage({ params }: TagPostsPageProps) {
  const { tag } = await params;

  return (
    <DashboardLayout>
      <ErrorBoundary fallback={<ErrorFallback showRefresh showHomeButton />}>
        <TagPostsContent tag={decodeURIComponent(tag)} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
