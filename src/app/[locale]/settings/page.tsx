"use client";

import { SettingsContent } from "@/components/settings/SettingsContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement des paramètres."
            showRefresh={true}
          />
        }
      >
        <SettingsContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
