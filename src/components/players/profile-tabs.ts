/**
 * Type et helper partagés pour la navigation du profil joueur.
 *
 * Le composant visuel a été remplacé par `sections/PlayerDetailEditorialTabs`
 * (look éditorial). Ces utilitaires restent dans un fichier dédié pour
 * éviter une dépendance circulaire avec `PlayerTabContent`.
 */

export type ProfileTab =
  | "feed"
  | "activity"
  | "library"
  | "friends"
  | "reviews"
  | "collections"
  | "achievements"
  | "goals"
  | "stats"
  | "recommendations"
  | "settings";

/** Onglet par défaut affiché à l'arrivée sur la page profil. */
export function getDefaultTab(isOwner: boolean): ProfileTab {
  return isOwner ? "feed" : "activity";
}
