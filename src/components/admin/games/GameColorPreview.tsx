"use client";

import { type UseFormReturn } from "react-hook-form";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { AdminGenre, Company, AdminStore } from "@/types/admin-games";
import { buildGameColors, formatReleaseDate, formatPrice } from "@/lib/utils/game-utils";
import { useLocale } from "next-intl";
import { GameColorPreviewHero } from "./GameColorPreviewHero";
import { GameColorPreviewOverview } from "./GameColorPreviewOverview";

interface GameColorPreviewProps {
  form: UseFormReturn<AdminGameFormData>;
  genres: AdminGenre[];
  companies: Company[];
  stores: AdminStore[];
  t: (key: string) => string;
}

/**
 * Live preview of the game detail page.
 * Watches form fields and renders a miniature representation
 * matching the public GameHeroSection + GameOverviewSection.
 */
export function GameColorPreview({ form, genres, companies, stores, t }: GameColorPreviewProps) {
  const locale = useLocale();

  const bgColor = form.watch("background_color");
  const accentColor = form.watch("accent_color");
  const labelColor = form.watch("label_color");
  const textColor = form.watch("text_color");
  const title = form.watch("translations.0.title");
  const description = form.watch("translations.0.description");
  const coverUrl = form.watch("cover_image_url");
  const backgroundUrl = form.watch("background_image_url");
  const selectedGenres = form.watch("genres");
  const selectedCompanies = form.watch("companies");
  const releaseDate = form.watch("release_date");
  const metascoreRaw = form.watch("metascore");
  const prices = form.watch("prices");

  const colors = buildGameColors({
    backgroundColor: bgColor || undefined,
    accentColor: accentColor || undefined,
    labelColor: labelColor || undefined,
    textColor: textColor || undefined,
  });

  const formattedDate = formatReleaseDate(releaseDate || undefined, locale);
  const metascore =
    metascoreRaw !== null && metascoreRaw !== undefined && metascoreRaw !== ""
      ? Number(metascoreRaw)
      : null;

  // Resolve genre names from IDs
  const resolvedGenres = selectedGenres
    .map((g) => genres.find((gn) => gn.id === g.genre_id))
    .filter((g): g is AdminGenre => g !== null && g !== undefined)
    .slice(0, 5);

  // Resolve company names by role
  const developerNames = resolveCompanyNames(selectedCompanies, companies, "developer");
  const publisherNames = resolveCompanyNames(selectedCompanies, companies, "publisher");

  // Resolve prices with store names, sorted by price (matching GamePricingSection)
  const resolvedPrices = [...(prices || [])]
    .sort((a, b) => a.price - b.price)
    .slice(0, 5)
    .map((p) => ({
      storeName: stores.find((s) => s.id === p.store_id)?.name ?? "",
      price: formatPrice(p.price, p.currency, locale),
      platform: p.platform,
    }))
    .filter((p) => p.storeName);

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-700/40"
      style={{ backgroundColor: colors.backgroundColor }}
      data-testid="color-preview"
    >
      <GameColorPreviewHero
        colors={colors}
        title={title || ""}
        coverUrl={coverUrl || ""}
        backgroundUrl={backgroundUrl || ""}
        description={description || ""}
        genres={resolvedGenres}
        developers={developerNames}
        publishers={publisherNames}
        formattedDate={formattedDate}
        prices={resolvedPrices}
        t={t}
      />
      <GameColorPreviewOverview
        colors={colors}
        developers={developerNames}
        publishers={publisherNames}
        formattedDate={formattedDate}
        metascore={metascore}
        genres={resolvedGenres}
      />
    </div>
  );
}

/** Resolve company names from form company IDs for a given role */
function resolveCompanyNames(
  selectedCompanies: { company_id: string; role: string }[],
  allCompanies: Company[],
  role: "developer" | "publisher"
): string[] {
  return selectedCompanies
    .filter((c) => c.role === role)
    .map((c) => allCompanies.find((co) => co.id === c.company_id)?.name)
    .filter((name): name is string => name !== null && name !== undefined);
}
