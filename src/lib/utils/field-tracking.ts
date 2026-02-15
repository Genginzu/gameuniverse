import type { TrackableField } from "@/types/admin-games";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";

/**
 * Les 13 catégories de champs synchronisables depuis IGDB.
 * Utilisé pour le suivi des modifications manuelles.
 */
export const TRACKABLE_FIELDS: readonly TrackableField[] = [
  "translations",
  "cover_image",
  "background_image",
  "release_date",
  "metascore",
  "genres",
  "companies",
  "screenshots",
  "artworks",
  "age_ratings",
  "versions",
  "languages",
  "playtime",
] as const;

/**
 * Données actuelles d'un jeu en DB, utilisées pour la comparaison.
 * Sous-ensemble des champs retournés par le GET admin.
 */
export interface CurrentGameData {
  cover_image_url?: string | null;
  background_image_url?: string | null;
  release_date?: string | null;
  metascore?: number | null;
  playtime_hastily?: number | null;
  playtime_normally?: number | null;
  playtime_completely?: number | null;
  translations?: Array<{ language_code: string; title?: string; description?: string }>;
  genres?: Array<{ genre_id: string }>;
  companies?: Array<{ company_id: string; role: string; is_primary: boolean }>;
  screenshots?: Array<{ url: string }>;
  artwork?: Array<{ url: string }>;
  age_ratings?: Array<{ rating_id: string; is_primary: boolean; content_descriptors?: string[] }>;
  versions?: Array<{ version_title: string; description?: string | null }>;
  languages?: Array<{
    language_code: string;
    has_audio: boolean;
    has_subtitles: boolean;
    has_interface: boolean;
  }>;
}

// --- Helpers de comparaison ---

function normalizeString(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  return String(val);
}

function normalizeNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  return Number(val);
}

/** Compare deux tableaux d'objets triés par une clé, en comparant un sous-ensemble de propriétés */
function arraysEqual<T>(a: T[], b: T[], sortKey: keyof T, compareKeys: (keyof T)[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => String(x[sortKey]).localeCompare(String(y[sortKey])));
  const sortedB = [...b].sort((x, y) => String(x[sortKey]).localeCompare(String(y[sortKey])));
  return sortedA.every((itemA, i) => {
    const itemB = sortedB[i];
    return compareKeys.every((key) => String(itemA[key]) === String(itemB[key]));
  });
}

/**
 * Compare les données actuelles en DB avec les données soumises via le formulaire admin.
 * Retourne la liste des catégories de champs qui ont été modifiées.
 */
export function detectChangedFields(
  currentData: CurrentGameData,
  submittedData: AdminGameFormData
): TrackableField[] {
  const changed: TrackableField[] = [];

  // translations
  if (hasTranslationsChanged(currentData.translations ?? [], submittedData.translations)) {
    changed.push("translations");
  }

  // cover_image
  if (
    normalizeString(currentData.cover_image_url) !== normalizeString(submittedData.cover_image_url)
  ) {
    changed.push("cover_image");
  }

  // background_image
  if (
    normalizeString(currentData.background_image_url) !==
    normalizeString(submittedData.background_image_url)
  ) {
    changed.push("background_image");
  }

  // release_date
  if (normalizeString(currentData.release_date) !== normalizeString(submittedData.release_date)) {
    changed.push("release_date");
  }

  // metascore
  if (normalizeNumber(currentData.metascore) !== normalizeNumber(submittedData.metascore)) {
    changed.push("metascore");
  }

  // genres
  if (hasGenresChanged(currentData.genres ?? [], submittedData.genres)) {
    changed.push("genres");
  }

  // companies
  if (hasCompaniesChanged(currentData.companies ?? [], submittedData.companies)) {
    changed.push("companies");
  }

  // screenshots
  if (hasScreenshotsChanged(currentData.screenshots ?? [], submittedData.screenshots ?? [])) {
    changed.push("screenshots");
  }

  // artworks
  if (hasArtworksChanged(currentData.artwork ?? [], submittedData.artwork ?? [])) {
    changed.push("artworks");
  }

  // age_ratings
  if (hasAgeRatingsChanged(currentData.age_ratings ?? [], submittedData.age_ratings ?? [])) {
    changed.push("age_ratings");
  }

  // versions
  if (hasVersionsChanged(currentData.versions ?? [], submittedData.versions ?? [])) {
    changed.push("versions");
  }

  // languages
  if (hasLanguagesChanged(currentData.languages ?? [], submittedData.languages ?? [])) {
    changed.push("languages");
  }

  // playtime
  if (hasPlaytimeChanged(currentData, submittedData)) {
    changed.push("playtime");
  }

  return changed;
}

// --- Comparateurs spécifiques par champ ---

function hasTranslationsChanged(
  current: Array<{ language_code: string; title?: string; description?: string }>,
  submitted: Array<{ language_code: string; title?: string; description?: string }>
): boolean {
  if (current.length !== submitted.length) return true;
  const sortedCurrent = [...current].sort((a, b) => a.language_code.localeCompare(b.language_code));
  const sortedSubmitted = [...submitted].sort((a, b) =>
    a.language_code.localeCompare(b.language_code)
  );
  return sortedCurrent.some((c, i) => {
    const s = sortedSubmitted[i];
    return (
      c.language_code !== s.language_code ||
      normalizeString(c.title) !== normalizeString(s.title) ||
      normalizeString(c.description) !== normalizeString(s.description)
    );
  });
}

function hasGenresChanged(
  current: Array<{ genre_id: string }>,
  submitted: Array<{ genre_id: string }>
): boolean {
  if (current.length !== submitted.length) return true;
  const currentIds = new Set(current.map((g) => g.genre_id));
  return submitted.some((g) => !currentIds.has(g.genre_id));
}

function hasCompaniesChanged(
  current: Array<{ company_id: string; role: string; is_primary: boolean }>,
  submitted: Array<{ company_id: string; role: string; is_primary: boolean }>
): boolean {
  return !arraysEqual(current, submitted, "company_id", ["company_id", "role", "is_primary"]);
}

function hasScreenshotsChanged(
  current: Array<{ url: string }>,
  submitted: Array<{ url: string }>
): boolean {
  if (current.length !== submitted.length) return true;
  const currentUrls = new Set(current.map((s) => s.url));
  return submitted.some((s) => !currentUrls.has(s.url));
}

function hasArtworksChanged(
  current: Array<{ url: string }>,
  submitted: Array<{ url: string }>
): boolean {
  if (current.length !== submitted.length) return true;
  const currentUrls = new Set(current.map((a) => a.url));
  return submitted.some((a) => !currentUrls.has(a.url));
}

function hasAgeRatingsChanged(
  current: Array<{ rating_id: string; is_primary: boolean; content_descriptors?: string[] }>,
  submitted: Array<{ rating_id: string; is_primary: boolean; content_descriptors?: string[] }>
): boolean {
  if (current.length !== submitted.length) return true;
  const sortedCurrent = [...current].sort((a, b) => a.rating_id.localeCompare(b.rating_id));
  const sortedSubmitted = [...submitted].sort((a, b) => a.rating_id.localeCompare(b.rating_id));
  return sortedCurrent.some((c, i) => {
    const s = sortedSubmitted[i];
    if (c.rating_id !== s.rating_id || c.is_primary !== s.is_primary) return true;
    const cDesc = [...(c.content_descriptors ?? [])].sort();
    const sDesc = [...(s.content_descriptors ?? [])].sort();
    return cDesc.length !== sDesc.length || cDesc.some((d, j) => d !== sDesc[j]);
  });
}

function hasVersionsChanged(
  current: Array<{ version_title: string; description?: string | null }>,
  submitted: Array<{ version_title: string; description?: string | null }>
): boolean {
  return !arraysEqual(current, submitted, "version_title", ["version_title", "description"]);
}

function hasLanguagesChanged(
  current: Array<{
    language_code: string;
    has_audio: boolean;
    has_subtitles: boolean;
    has_interface: boolean;
  }>,
  submitted: Array<{
    language_code: string;
    has_audio: boolean;
    has_subtitles: boolean;
    has_interface: boolean;
  }>
): boolean {
  return !arraysEqual(current, submitted, "language_code", [
    "language_code",
    "has_audio",
    "has_subtitles",
    "has_interface",
  ]);
}

function hasPlaytimeChanged(current: CurrentGameData, submitted: AdminGameFormData): boolean {
  return (
    normalizeNumber(current.playtime_hastily) !== normalizeNumber(submitted.playtime_hastily) ||
    normalizeNumber(current.playtime_normally) !== normalizeNumber(submitted.playtime_normally) ||
    normalizeNumber(current.playtime_completely) !== normalizeNumber(submitted.playtime_completely)
  );
}

// --- Upsert des overrides ---

/** Interface minimale du client Supabase pour le typage sans dépendance directe */
export interface SupabaseClientLike {
  from: (table: string) => {
    upsert: (
      data: Array<{
        game_id: string;
        field_name: string;
        modified_by: string | null;
        modified_at: string;
      }>,
      options?: { onConflict: string }
    ) => { select: () => Promise<{ data: unknown; error: { message: string } | null }> };
  };
}

/**
 * Insère ou met à jour les overrides pour les champs modifiés.
 * Utilise un upsert sur la contrainte UNIQUE(game_id, field_name)
 * pour éviter les doublons (idempotence).
 */
export async function upsertFieldOverrides(
  supabase: SupabaseClientLike,
  gameId: string,
  changedFields: TrackableField[],
  userId: string | null
): Promise<void> {
  if (changedFields.length === 0) return;

  const now = new Date().toISOString();
  const rows = changedFields.map((field) => ({
    game_id: gameId,
    field_name: field,
    modified_by: userId,
    modified_at: now,
  }));

  const { error } = await supabase
    .from("game_field_overrides")
    .upsert(rows, { onConflict: "game_id,field_name" })
    .select();

  if (error) {
    throw new Error(`Failed to upsert field overrides: ${error.message}`);
  }
}
