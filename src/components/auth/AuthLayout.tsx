import { Link } from "@/i18n/navigation";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import Footer from "@/components/shared/Footer";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="relative">
        <div className="absolute inset-0 bg-linear-to-r from-slate-900/5 to-slate-800/5 backdrop-blur-xs dark:from-slate-100/5 dark:to-slate-200/5" />
        <div className="relative flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="flex items-center space-x-3">
            <GameUniverseLogo size="md" />
            <span className="bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent dark:from-gray-100 dark:to-gray-300">
              Game Universe
            </span>
          </Link>
          <div className="rounded-2xl backdrop-blur-xs">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4 py-8 sm:p-6 sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <Footer />
    </div>
  );
}
