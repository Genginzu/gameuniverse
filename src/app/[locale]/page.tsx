"use client";

import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { HomeContent } from "@/components/home/HomeContent";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function Home() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page d'accueil."
            showRefresh={true}
          />
        }
      >
        <HomeContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
