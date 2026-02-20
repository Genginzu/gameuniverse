import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarHeart } from "lucide-react";

/**
 * Pure function that determines which year to link to for the year-in-review page.
 *
 * - If the current year is in availableYears, return it.
 * - Otherwise return the most recent (largest) available year.
 * - If no years are available, return null (hide the link).
 *
 * Exported for property-based testing (Property 8).
 */
export function resolveYearLink(availableYears: number[], currentYear: number): number | null {
  if (availableYears.length === 0) return null;

  if (availableYears.includes(currentYear)) return currentYear;

  // Pick the most recent year with data
  return Math.max(...availableYears);
}

interface YearInReviewLinkProps {
  playerId: string;
  availableYears: number[];
}

export function YearInReviewLink({ playerId, availableYears }: YearInReviewLinkProps) {
  // TODO: réactiver quand la feature résumé annuel sera prête
  return null;
}
