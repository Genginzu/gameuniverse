/**
 * Game details — public exports.
 *
 * L'orchestrateur principal `GameDetailsContent` compose les sections
 * éditoriales (voir `./sections/`). Cette barrel n'expose que les
 * composants utilisés en dehors du dossier (page racine, players profile,
 * etc.).
 */

export { GameDetailsContent } from "./GameDetailsContent";
export { GameDetailsSkeleton } from "./GameDetailsSkeleton";
export { PersonalRecommendationSection } from "./PersonalRecommendationSection";
