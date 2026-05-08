import { AdminLayout } from "@/components/layout/admin/AdminLayout";

// Admin pages are fully dynamic — no ISR/static generation needed
export const dynamic = "force-dynamic";

interface AdminLayoutPageProps {
  children: React.ReactNode;
}

export default function AdminLayoutPage({ children }: AdminLayoutPageProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
