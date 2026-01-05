import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FaSearch } from "react-icons/fa";

export default function DashboardHeader() {
    return (
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo + Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <GameUniverseLogo size="sm" />
              <span className="text-xl font-bold text-gray-900">Game Universe</span>
            </Link>
          </div>

          {/* Center Left - Search Bar */}
          <div className="ml-8 max-w-md flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                className="w-full rounded-xl border-gray-200 bg-gray-50 pl-10 focus:bg-white"
              />
            </div>
          </div>

          {/* Right side - All Navigation Links + Language Switcher */}
          <div className="flex items-center space-x-8">
            <nav className="hidden items-center space-x-8 md:flex">
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
            <LanguageSwitcher />
          </div>
        </div>
      </header>
    );
}