"use client";

import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement du tableau de bord."
            showRefresh={true}
          />
        }
      >
        <DashboardContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
