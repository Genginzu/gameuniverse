import type { CollectionItem } from "@/types/collection";

// Re-export CRUD functions for a single import point
export { fetchCollections, fetchCollectionDetail } from "./collectionQueries";
export {
  createCollection,
  updateCollection,
  deleteCollection,
  addItem,
  removeItem,
  reorderItems,
} from "./collectionMutations";

/**
 * Génère un slug URL-safe à partir d'un nom de collection.
 *
 * Le slug est composé uniquement de caractères alphanumériques minuscules
 * et de tirets. Les caractères accentués sont translittérés, les espaces
 * et caractères spéciaux sont remplacés par des tirets, et les tirets
 * consécutifs sont fusionnés.
 *
 * @param name - Le nom de la collection
 * @returns Un slug URL-safe, non vide et déterministe
 */
export function generateSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Remplace les non-alphanumériques par des tirets
    .replace(/^-+|-+$/g, ""); // Supprime les tirets en début/fin

  // Garantir un slug non vide pour tout input
  return slug || "collection";
}

/**
 * Calcule la prochaine position pour un nouvel élément dans une collection.
 *
 * La position correspond au nombre d'éléments existants (index 0-based),
 * ce qui place le nouvel élément à la fin de la liste.
 *
 * @param items - Les éléments actuels de la collection
 * @returns La position du prochain élément (= items.length)
 */
export function calculateNextPosition(items: CollectionItem[]): number {
  return items.length;
}

/**
 * Réordonne les positions après la suppression d'un élément.
 *
 * Retire l'élément à l'index donné et réattribue des positions contiguës
 * de 0 à N-2 aux éléments restants, en préservant leur ordre relatif.
 *
 * @param items - Les éléments avant suppression (ordonnés par position)
 * @param removedIndex - L'index de l'élément à retirer
 * @returns Les éléments restants avec des positions contiguës
 */
export function reorderPositions(
  items: Array<{ gameId: string }>,
  removedIndex: number
): Array<{ gameId: string; position: number }> {
  return items
    .filter((_, index) => index !== removedIndex)
    .map((item, index) => ({
      gameId: item.gameId,
      position: index,
    }));
}
