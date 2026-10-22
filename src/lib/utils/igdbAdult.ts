/** IGDB theme id of "Erotic". Games carrying it are flagged `is_adult` and kept out of trending. */
export const IGDB_EROTIC_THEME_ID = 42;

/** True when the IGDB `themes` field (ids or expanded objects) contains the Erotic theme. */
export function isAdultIgdbGame(
  themes: ReadonlyArray<number | { id: number }> | undefined
): boolean {
  return (themes ?? []).some(
    (theme) => (typeof theme === "number" ? theme : theme.id) === IGDB_EROTIC_THEME_ID
  );
}
