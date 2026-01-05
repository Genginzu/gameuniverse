"use client";

import { AllGamesContent } from "@/components/games/AllGamesContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

export default function AllGamesPage() {
  return (
    <DashboardLayout>
      <AllGamesContent />
    </DashboardLayout>
  );
}
