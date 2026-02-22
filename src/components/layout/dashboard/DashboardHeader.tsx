import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import { GlobalSearchBar } from "@/components/shared/GlobalSearchBar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function DashboardHeader({ sidebarOpen, setSidebarOpen }: DashboardHeaderProps) {
  return (
    <header className="glass-header relative z-30 px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button + Logo + Brand */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <Button
            id="sidebar-toggle"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
          </Button>

          <Link href="/" className="flex items-center space-x-2 lg:space-x-3">
            <GameUniverseLogo size="sm" />
            <span className="text-lg font-bold text-gray-900 dark:text-white lg:text-xl">
              <span className="hidden sm:inline">Game Universe</span>
              <span className="sm:hidden">GU</span>
            </span>
          </Link>
        </div>

        {/* Center - Hybrid Search Bar (hidden on mobile) */}
        <div className="ml-4 hidden max-w-md flex-1 md:block lg:ml-8">
          <GlobalSearchBar />
        </div>

        {/* Right side - Navigation Links + Language Switcher */}
        <div className="flex items-center space-x-2 lg:space-x-8">
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-4 lg:flex lg:space-x-8">
            <Link
              href="/games"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Jeux
            </Link>
            <Link
              href="/characters"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Personnages
            </Link>
            <Link
              href="/players"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Joueurs
            </Link>
          </nav>

          <LanguageSwitcher />
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="mt-3 md:hidden">
        <GlobalSearchBar />
      </div>
    </header>
  );
}
