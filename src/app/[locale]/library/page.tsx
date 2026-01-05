"use client";

import { UserLibraryContent } from "@/components/library/UserLibraryContent";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

export default function LibraryPage() {
  return (
    <DashboardLayout>
      <UserLibraryContent />
    </DashboardLayout>
  );
}
