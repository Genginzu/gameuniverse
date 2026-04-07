import { AllPlayersContent } from "@/components/players/AllPlayersContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function AllPlayersPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary
        fallback={
          <ErrorFallback
            description="Une erreur s'est produite lors du chargement de la page des joueurs."
            showRefresh={true}
            showHomeButton={true}
          />
        }
      >
        <AllPlayersContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
