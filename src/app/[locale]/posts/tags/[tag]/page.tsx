import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { TagPostsContent } from "@/components/posts/TagPostsContent";
import { tagPostsListing } from "@/lib/listing/resources/posts";
import { fetchListingDefault } from "@/lib/listing/server";
import type { TagPostsResponse } from "@/types/post";

export const revalidate = 60;

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
  const { locale, tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const initialData = await fetchListingDefault<TagPostsResponse>(tagPostsListing, {
    locale,
    pathParams: { tag: decodedTag },
  });

  return (
    <EditorialShell>
      <ErrorBoundary fallback={<ErrorFallback showRefresh showHomeButton />}>
        <TagPostsContent tag={decodedTag} initialData={initialData} />
      </ErrorBoundary>
    </EditorialShell>
  );
}
