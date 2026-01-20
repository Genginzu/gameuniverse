"use client";

import { UserLibraryContent } from "@/components/library/UserLibraryContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function LibraryPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de votre bibliothèque."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <UserLibraryContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
