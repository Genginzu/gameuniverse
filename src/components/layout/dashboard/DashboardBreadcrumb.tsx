import { useTranslations } from "next-intl";
import Link from "next/link";

export default function DashboardBreadcrumb() {
  const t = useTranslations("dashboard");
  return (
    <div className="glass border-x-0 border-t-0 px-6 py-4">
      <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="transition-colors hover:text-gray-700 dark:hover:text-gray-200">
          🏠 Accueil
        </Link>
        <span className="text-gray-300 dark:text-gray-600">›</span>
        <span className="text-gray-900 dark:text-white">{t("dashboard")}</span>
      </nav>
    </div>
  );
}
