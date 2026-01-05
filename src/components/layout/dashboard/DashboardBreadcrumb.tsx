import { useTranslations } from "next-intl";
import Link from "next/link";

export default function DashboardBreadcrumb() {
  const t = useTranslations("dashboard");
  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">
          🏠 Accueil
        </Link>
        <span>›</span>
        <span className="text-gray-900">{t("dashboard")}</span>
      </nav>
    </div>
  );
}
