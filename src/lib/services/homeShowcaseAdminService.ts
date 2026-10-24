/**
 * Admin management of the home showcase (`home_showcase_items`).
 * Writes use the service role: clients have no write grant on the table.
 * Callers must be routes declared with `defineRoute({ auth: "admin" })`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { pickTranslation } from "@/lib/utils/pickTranslation";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { AddShowcaseItemInput, ReorderShowcaseInput } from "@/lib/validations/home-showcase";
import {
  SHOWCASE_LIMITS,
  type AdminShowcaseItem,
  type HomeShowcaseKind,
  type ShowcaseLibraryStatus,
} from "@/types/home";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

export type ShowcaseErrorCode = "limit" | "duplicate" | "notFound" | "database";

export class ShowcaseError extends Error {
  constructor(public readonly code: ShowcaseErrorCode) {
    super(`Showcase error: ${code}`);
  }
}

interface ShowcaseRow {
  id: string;
  kind: HomeShowcaseKind;
  display_order: number;
  library_status: ShowcaseLibraryStatus | null;
  games: {
    id: string;
    slug: string;
    cover_image_url: string | null;
    game_translations: { language_code: string; title: string }[] | null;
  } | null;
  characters: {
    id: string;
    slug: string;
    main_image: string | null;
    character_translations: { language_code: string; name: string }[] | null;
  } | null;
}

const LIST_SELECT = `id, kind, display_order, library_status,
  games(id, slug, cover_image_url, game_translations(language_code, title)),
  characters(id, slug, main_image, character_translations(language_code, name))`;

function toAdminItem(row: ShowcaseRow, locale: string): AdminShowcaseItem {
  const game = row.games;
  const character = row.characters;
  const entity = game
    ? {
        id: game.id,
        slug: game.slug,
        name: pickTranslation(game.game_translations, locale)?.title ?? game.slug,
        imageUrl: game.cover_image_url,
      }
    : character
      ? {
          id: character.id,
          slug: character.slug,
          name: pickTranslation(character.character_translations, locale)?.name ?? character.slug,
          imageUrl: character.main_image,
        }
      : null;

  return {
    id: row.id,
    kind: row.kind,
    displayOrder: row.display_order,
    libraryStatus: row.library_status,
    entity,
  };
}

export async function listShowcaseItems(
  supabase: AnySupabaseClient,
  locale: string
): Promise<AdminShowcaseItem[]> {
  const { data, error } = await untypedTable(supabase, "home_showcase_items")
    .select(LIST_SELECT)
    .order("kind", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) throw new ShowcaseError("database");
  return (data as unknown as ShowcaseRow[]).map((row) => toAdminItem(row, locale));
}

export async function addShowcaseItem(
  supabase: AnySupabaseClient,
  input: AddShowcaseItemInput
): Promise<{ id: string }> {
  const { data: existing, error: existingError } = await untypedTable(
    supabase,
    "home_showcase_items"
  )
    .select("display_order")
    .eq("kind", input.kind)
    .order("display_order", { ascending: false });

  if (existingError) throw new ShowcaseError("database");
  const rows = (existing ?? []) as unknown as { display_order: number }[];
  if (rows.length >= SHOWCASE_LIMITS[input.kind]) throw new ShowcaseError("limit");

  const isGame = input.kind === "game";
  const { data, error } = await untypedTable(supabase, "home_showcase_items")
    .insert({
      kind: input.kind,
      game_id: isGame ? input.entityId : null,
      character_id: isGame ? null : input.entityId,
      library_status: isGame ? (input.libraryStatus ?? "playing") : null,
      display_order: rows.length > 0 ? rows[0].display_order + 1 : 0,
    })
    .select("id")
    .single();

  if (error?.code === "23505") throw new ShowcaseError("duplicate");
  if (error?.code === "23503") throw new ShowcaseError("notFound");
  if (error || !data) throw new ShowcaseError("database");
  return { id: (data as unknown as { id: string }).id };
}

export async function reorderShowcaseItems(
  supabase: AnySupabaseClient,
  input: ReorderShowcaseInput
): Promise<void> {
  const results = await Promise.all(
    input.ids.map((id, index) =>
      untypedTable(supabase, "home_showcase_items")
        .update({ display_order: index })
        .eq("id", id)
        .eq("kind", input.kind)
    )
  );
  if (results.some((result) => result.error)) throw new ShowcaseError("database");
}

export async function updateShowcaseItemStatus(
  supabase: AnySupabaseClient,
  id: string,
  libraryStatus: ShowcaseLibraryStatus
): Promise<void> {
  const { data, error } = await untypedTable(supabase, "home_showcase_items")
    .update({ library_status: libraryStatus })
    .eq("id", id)
    .eq("kind", "game")
    .select("id");

  if (error) throw new ShowcaseError("database");
  if (!data || data.length === 0) throw new ShowcaseError("notFound");
}

export async function deleteShowcaseItem(supabase: AnySupabaseClient, id: string): Promise<void> {
  const { error } = await untypedTable(supabase, "home_showcase_items").delete().eq("id", id);
  if (error) throw new ShowcaseError("database");
}
