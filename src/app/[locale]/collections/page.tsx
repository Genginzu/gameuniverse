"use client";

import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { MyCollectionsContent } from "@/components/collections/MyCollectionsContent";

export default function CollectionsPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary fallback={<ErrorFallback showRefresh={true} showHomeButton={true} />}>
        <MyCollectionsContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
