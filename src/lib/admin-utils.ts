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
