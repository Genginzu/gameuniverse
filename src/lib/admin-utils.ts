// Re-export all admin utilities from split modules for backward compatibility
export {
  getAvailableCompanies,
  getAvailableGenres,
  getAvailableStores,
  getAvailableSupportedLanguages,
  getAvailableRatings,
  getAvailableContentDescriptors,
  getAvailableGamePlatforms,
  getGameStatistics,
} from "./admin-fetchers";

export { validateGameSlug, validateGameData } from "./admin-validators";

export { generateSlugFromTitle } from "@/lib/utils/slug-utils";
