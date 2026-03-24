import { pickTranslation } from "@/lib/utils/pickTranslation";

/* ── Gender / Species ID fetcher (graceful if columns don't exist yet) ── */

export async function fetchGenderSpeciesIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  characterId: string
): Promise<{ genderId: string | null; speciesId: string | null } | null> {
  try {
    const { data } = await supabase
      .from("characters")
      .select("gender_id, species_id")
      .eq("id", characterId)
      .single();
    if (!data) return null;
    return { genderId: data.gender_id, speciesId: data.species_id };
  } catch {
    // Columns may not exist if migration hasn't been applied
    return null;
  }
}

/* ── Gender / Species fetchers ── */

export async function fetchGender(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  genderId: string | null,
  locale: string
): Promise<{ id: string; slug: string; name: string } | undefined> {
  if (!genderId) return undefined;
  try {
    const { data } = await supabase
      .from("genders")
      .select("id, slug, gender_translations(language_code, name)")
      .eq("id", genderId)
      .single();
    if (!data) return undefined;
    const gt = pickTranslation(data.gender_translations, locale);
    return gt ? { id: data.id, slug: data.slug, name: gt.name } : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchSpecies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  speciesId: string | null,
  locale: string
): Promise<{ id: string; slug: string; name: string } | undefined> {
  if (!speciesId) return undefined;
  try {
    const { data } = await supabase
      .from("species")
      .select("id, slug, species_translations(language_code, name)")
      .eq("id", speciesId)
      .single();
    if (!data) return undefined;
    const st = pickTranslation(data.species_translations, locale);
    return st ? { id: data.id, slug: data.slug, name: st.name } : undefined;
  } catch {
    return undefined;
  }
}

/* ── Relationships fetcher ── */

export async function fetchRelationships(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  characterId: string,
  locale: string
) {
  const { data: rels } = await supabase
    .from("character_relationships")
    .select("id, relationship_type, description, related_character_id")
    .eq("character_id", characterId);

  if (!rels || rels.length === 0) return [];

  const relatedIds = rels.map((r: { related_character_id: string }) => r.related_character_id);
  const { data: relatedChars } = await supabase
    .from("characters")
    .select("id, slug, main_image, character_translations(name, role, language_code)")
    .in("id", relatedIds);

  return rels
    .map(
      (rel: {
        id: string;
        relationship_type: string;
        description: string | null;
        related_character_id: string;
      }) => {
        const related = relatedChars?.find(
          (c: { id: string }) => c.id === rel.related_character_id
        );
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
      }
    )
    .filter(Boolean);
}

/* ── Data transformers ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildGames(characterGames: any[]) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildMedia(character: any) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPlatforms(characterGames: any[], locale: string) {
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
