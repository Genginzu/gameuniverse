import { pickTranslation } from "@/lib/utils/pickTranslation";
import type { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

/* ── Gender / Species ID fetcher (graceful if columns don't exist yet) ── */

export async function fetchGenderSpeciesIds(
  supabase: SupabaseClient,
  characterId: string
): Promise<{ genderId: string | null; speciesId: string | null } | null> {
  try {
    const { data } = await untypedTable(supabase, "characters")
      .select("gender_id, species_id")
      .eq("id", characterId)
      .single();
    if (!data) return null;
    const row = data as { gender_id: string | null; species_id: string | null };
    return { genderId: row.gender_id, speciesId: row.species_id };
  } catch {
    // Columns may not exist if migration hasn't been applied
    return null;
  }
}

/* ── Gender / Species fetchers ── */

export async function fetchGender(
  supabase: SupabaseClient,
  genderId: string | null,
  locale: string
): Promise<{ id: string; slug: string; name: string } | undefined> {
  if (!genderId) return undefined;
  try {
    const { data } = await untypedTable(supabase, "genders")
      .select("id, slug, gender_translations(language_code, name)")
      .eq("id", genderId)
      .single();
    if (!data) return undefined;
    const row = data as {
      id: string;
      slug: string;
      gender_translations: { language_code: string; name: string }[];
    };
    const gt = pickTranslation(row.gender_translations, locale);
    return gt ? { id: row.id, slug: row.slug, name: gt.name } : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchSpecies(
  supabase: SupabaseClient,
  speciesId: string | null,
  locale: string
): Promise<{ id: string; slug: string; name: string } | undefined> {
  if (!speciesId) return undefined;
  try {
    const { data } = await untypedTable(supabase, "species")
      .select("id, slug, species_translations(language_code, name)")
      .eq("id", speciesId)
      .single();
    if (!data) return undefined;
    const row = data as {
      id: string;
      slug: string;
      species_translations: { language_code: string; name: string }[];
    };
    const st = pickTranslation(row.species_translations, locale);
    return st ? { id: row.id, slug: row.slug, name: st.name } : undefined;
  } catch {
    return undefined;
  }
}

/* ── Relationships fetcher ── */

export async function fetchRelationships(
  supabase: SupabaseClient,
  characterId: string,
  locale: string
) {
  const { data: rels } = await untypedTable(supabase, "character_relationships")
    .select("id, relationship_type, description, related_character_id")
    .eq("character_id", characterId);

  if (!rels || rels.length === 0) return [];

  const typedRels = rels as Array<{
    id: string;
    relationship_type: string;
    description: string | null;
    related_character_id: string;
  }>;
  const relatedIds = typedRels.map((r) => r.related_character_id);
  const { data: relatedCharsRaw } = await supabase
    .from("characters")
    .select("id, slug, main_image, character_translations(name, role, language_code)")
    .in("id", relatedIds);

  const relatedChars = (relatedCharsRaw ?? []) as Array<{
    id: string;
    slug: string;
    main_image: string | null;
    character_translations: Array<{ language_code: string; name: string; role: string | null }>;
  }>;

  return typedRels
    .map((rel) => {
      const related = relatedChars.find((c) => c.id === rel.related_character_id);
      if (!related) return null;
      const t = pickTranslation(related.character_translations, locale);
      return {
        id: rel.id,
        relatedCharacter: {
          id: related.id,
          slug: related.slug,
          name: t?.name || "Unknown",
          mainImage: related.main_image,
          role: t?.role ?? null,
        },
        relationshipType: rel.relationship_type,
        description: rel.description,
      };
    })
    .filter(Boolean);
}

/* ── Data transformers ── */

interface CharacterGameRow {
  games?: {
    id?: string;
    slug?: string;
    cover_image_url?: string | null;
    background_image_url?: string | null;
    release_date?: string | null;
    game_translations?: Array<{ title: string }>;
    game_platforms?: Array<{
      platforms?: {
        id: string;
        slug: string;
        icon_url?: string | null;
        platform_translations?: Array<{
          language_code: string;
          name: string;
          abbreviation?: string | null;
        }>;
      };
    }>;
  };
  is_primary?: boolean;
}

interface CharacterRow {
  main_image?: string | null;
  background_image?: string | null;
  character_media?: Array<{
    id: string;
    type: string;
    url: string;
    alt_text?: string | null;
    description?: string | null;
    title?: string | null;
    is_featured?: boolean | null;
    display_order?: number | null;
    thumbnail_url?: string | null;
  }>;
}

export function buildGames(characterGames: CharacterGameRow[]) {
  return (
    characterGames
      ?.map((cg) => ({
        id: cg.games?.id,
        slug: cg.games?.slug,
        title: cg.games?.game_translations?.[0]?.title || "Unknown",
        coverImage: cg.games?.cover_image_url,
        backgroundImage: cg.games?.background_image_url,
        releaseYear: cg.games?.release_date
          ? new Date(cg.games.release_date).getFullYear()
          : undefined,
        isPrimary: cg.is_primary || false,
      }))
      .sort(
        (a: { isPrimary: boolean; title: string }, b: { isPrimary: boolean; title: string }) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return a.title.localeCompare(b.title);
        }
      ) || []
  );
}

export function buildMedia(character: CharacterRow) {
  const items = character.character_media || [];
  const sortByOrder = (a: { display_order: number | null }, b: { display_order: number | null }) =>
    (a.display_order || 0) - (b.display_order || 0);

  return {
    mainImage: character.main_image,
    backgroundImage: character.background_image,
    screenshots: items
      .filter((m: { type: string }) => m.type === "screenshot")
      .sort(sortByOrder)
      .map(
        (m: {
          id: string;
          url: string;
          alt_text: string | null;
          description: string | null;
          is_featured: boolean | null;
        }) => ({
          id: m.id,
          url: m.url,
          altText: m.alt_text,
          caption: m.description,
          isFeatured: m.is_featured || false,
        })
      ),
    artwork: items
      .filter((m: { type: string }) => m.type === "artwork")
      .sort(sortByOrder)
      .map(
        (m: {
          id: string;
          url: string;
          alt_text: string | null;
          description: string | null;
          title: string | null;
          is_featured: boolean | null;
        }) => ({
          id: m.id,
          url: m.url,
          altText: m.alt_text,
          caption: m.description,
          type: m.title || "artwork",
          isFeatured: m.is_featured || false,
        })
      ),
    videos: items
      .filter((m: { type: string }) => m.type === "video")
      .sort(sortByOrder)
      .map(
        (m: {
          id: string;
          title: string | null;
          description: string | null;
          url: string;
          thumbnail_url: string | null;
          is_featured: boolean | null;
        }) => ({
          id: m.id,
          title: m.title || "Video",
          description: m.description,
          url: m.url,
          thumbnailUrl: m.thumbnail_url,
          type: "video",
          isFeatured: m.is_featured || false,
        })
      ),
  };
}

export function buildPlatforms(characterGames: CharacterGameRow[], locale: string) {
  const map = new Map<
    string,
    { id: string; slug: string; name: string; abbreviation: string | null; iconUrl: string | null }
  >();

  for (const cg of characterGames ?? []) {
    for (const gp of cg.games?.game_platforms ?? []) {
      const p = gp.platforms;
      if (!p || map.has(p.id)) continue;
      const trs = p.platform_translations ?? [];
      const tr =
        trs.find((t: { language_code: string }) => t.language_code === locale) ||
        trs.find((t: { language_code: string }) => t.language_code === "en") ||
        trs[0];
      map.set(p.id, {
        id: p.id,
        slug: p.slug,
        name: tr?.name || p.slug,
        abbreviation: tr?.abbreviation || null,
        iconUrl: p.icon_url,
      });
    }
  }

  return Array.from(map.values());
}
