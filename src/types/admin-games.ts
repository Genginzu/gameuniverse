// Types pour l'administration des jeux

import type { UseFormReturn } from "react-hook-form";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";

export interface AdminGame {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  releaseDate: string | null;
  updatedAt: string;
}

export interface FetchGamesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Genre {
  id: string;
  slug: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface Rating {
  id: string;
  code: string;
  display_name: string;
  minimum_age: number | null;
  color_hex: string | null;
  icon_url: string | null;
  system: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface ContentDescriptor {
  id: string;
  code: string;
  rating_system_id: string | null;
  name: string;
  description: string | null;
}

/** Props communes à tous les onglets du formulaire */
export interface GameFormTabProps {
  form: UseFormReturn<AdminGameFormData>;
  t: (key: string) => string;
}

export type TabId =
  | "general"
  | "images"
  | "translations"
  | "genres"
  | "companies"
  | "age_ratings"
  | "versions"
  | "languages";

export interface Tab {
  id: TabId;
  icon: React.ReactNode;
  labelKey: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;
