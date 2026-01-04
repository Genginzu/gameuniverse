"use client";

import { AuthenticatedPage } from "@/components/shared/AuthenticatedPage";
import { AllGamesContent } from "@/components/games/AllGamesContent";

export default function AllGamesPage() {
  return (
    <AuthenticatedPage>
      <AllGamesContent />
    </AuthenticatedPage>
  );
}
