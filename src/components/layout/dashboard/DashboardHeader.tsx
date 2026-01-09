import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaSearch, FaBars, FaTimes } from "react-icons/fa";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function DashboardHeader({ sidebarOpen, setSidebarOpen }: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 lg:px-6 lg:py-4">
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
            <span className="text-lg font-bold text-gray-900 lg:text-xl">
              <span className="hidden sm:inline">Game Universe</span>
              <span className="sm:hidden">GU</span>
            </span>
          </Link>
        </div>

        {/* Center - Search Bar (hidden on mobile) */}
        <div className="ml-4 hidden max-w-md flex-1 md:block lg:ml-8">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher..."
              className="w-full rounded-xl border-gray-200 bg-gray-50 pl-10 focus:bg-white"
            />
          </div>
        </div>

        {/* Right side - Navigation Links + Language Switcher */}
        <div className="flex items-center space-x-2 lg:space-x-8">
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-4 lg:flex lg:space-x-8">
            <Link
              href="/games"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Jeux
            </Link>
            <Link
              href="/characters"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Personnages
            </Link>
            <Link
              href="/professionals"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Professionnels
            </Link>
            <Link
              href="/social"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Social
            </Link>
            <Link
              href="/players"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Joueurs
            </Link>
          </nav>

          {/* Mobile search button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <FaSearch className="h-4 w-4" />
          </Button>

          <LanguageSwitcher />
        </div>
      </div>

      {/* Mobile search bar (shown when needed) */}
      <div className="mt-3 md:hidden">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher..."
            className="w-full rounded-xl border-gray-200 bg-gray-50 pl-10 focus:bg-white"
          />
        </div>
      </div>
    </header>
  );
}
