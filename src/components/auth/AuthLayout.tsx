import { Link } from "@/i18n/navigation";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import { HeaderLanguageSwitcher } from "@/components/layout/editorial/HeaderLanguageSwitcher";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-editorial-bg text-white">
      <header className="border-b border-editorial-line">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-3">
            <GameUniverseLogo size="md" />
            <span className="font-display text-lg font-bold tracking-wide text-white sm:text-xl">
              Gamers Universe
            </span>
          </Link>
          <HeaderLanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="border-t border-editorial-line px-4 py-6 text-center text-xs text-editorial-muted sm:px-6">
        © {currentYear} Gamers Universe
      </footer>
    </div>
  );
}
