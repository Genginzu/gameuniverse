"use client";

import { AllCharactersContent } from "@/components/characters/AllCharactersContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function AllCharactersPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page des personnages."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <AllCharactersContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
