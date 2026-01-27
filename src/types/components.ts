// Types pour les props des composants

import { User } from "@supabase/supabase-js";
import { GameDetails } from "./game";
import { Genre } from "./genre";
import { AuthMode } from "./auth";

// Layout Components
export interface DashboardSidebarProps {
  user: User;
  signOut: () => Promise<void>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export interface LandingLayoutProps {
  children: React.ReactNode;
}

export interface IntlProviderProps {
  children: React.ReactNode;
  locale: string;
}

// Game Components
export interface GameCardProps {
  game: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    coverImage?: string;
    releaseDate?: string;
    releaseYear?: number;
    genres: Array<{ name: string; id?: string }>;
    developer: string;
    publisher: string;
    metascore?: number;
  };
}

export interface GameDetailsProps {
  game: GameDetails;
  locale: string;
}

export interface AllGamesContentProps {
  locale?: string;
}

export interface GameSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export interface GamePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export interface GameFiltersProps {
  genres: Genre[];
  selectedGenres: string[];
  onGenreToggle: (genreId: string) => void;
  onClearFilters: () => void;
}

export interface GameFilterButtonProps {
  hasFilters: boolean;
  filterCount: number;
  onClick: () => void;
}

export interface GameCompaniesProps {
  gameId: string;
  gameTitle?: string;
}

// Auth Components
export interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (newMode: AuthMode) => void;
}

export interface AuthSuccessMessageProps {
  message: string;
  show: boolean;
}

// UI Components
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  showText?: boolean;
  className?: string;
}

export interface GameUniverseLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}
