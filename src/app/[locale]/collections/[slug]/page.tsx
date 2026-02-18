"use client";

import { use } from "react";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { MyCollectionDetailContent } from "@/components/collections/MyCollectionDetailContent";

interface CollectionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { slug } = use(params);

  return (
    <DashboardLayout>
      <ErrorBoundary fallback={<ErrorFallback showRefresh={true} showHomeButton={true} />}>
        <MyCollectionDetailContent slug={slug} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
