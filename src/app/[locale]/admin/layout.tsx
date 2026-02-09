"use client";

import { AdminLayout } from "@/components/layout/admin/AdminLayout";

interface AdminLayoutPageProps {
  children: React.ReactNode;
}

export default function AdminLayoutPage({ children }: AdminLayoutPageProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
