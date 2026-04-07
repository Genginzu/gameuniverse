import { AllGamesContent } from "@/components/games/AllGamesContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function AllGamesPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page des jeux."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <AllGamesContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
