import { createServerClient } from "@/lib/supabase-server";
import type {
  CollectionItem,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddCollectionItemInput,
} from "@/types/collection";
import { generateSlug, calculateNextPosition } from "./collectionService";

// Tables not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/**
 * Résout l'id d'une collection à partir du slug et du propriétaire.
 */
async function resolveCollectionId(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  slug: string
): Promise<string> {
  const { data, error } = await supabase
    .from("game_collections" as UntypedFrom)
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return (data as unknown as { id: string }).id;
}

/**
 * Crée une nouvelle collection avec slug généré et visibilité privée par défaut.
 */
export async function createCollection(
  userId: string,
  input: CreateCollectionInput
): Promise<{ id: string; slug: string }> {
  const supabase = await createServerClient();
  const slug = generateSlug(input.name);

  const { data, error } = await supabase
    .from("game_collections" as UntypedFrom)
    .insert({
      user_id: userId,
      name: input.name,
      slug,
      description: input.description || null,
      is_public: input.isPublic ?? false,
      cover_image_url: input.coverImageUrl || null,
    })
    .select("id, slug")
    .single();

  if (error) throw error;
  return data as unknown as { id: string; slug: string };
}

/**
 * Met à jour une collection existante sans modifier le slug.
 */
export async function updateCollection(
  userId: string,
  slug: string,
  input: UpdateCollectionInput
): Promise<{ id: string; slug: string }> {
  const supabase = await createServerClient();

  const updatePayload: Record<string, unknown> = {};
  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.isPublic !== undefined) updatePayload.is_public = input.isPublic;
  if (input.coverImageUrl !== undefined)
    updatePayload.cover_image_url = input.coverImageUrl || null;

  const { data, error } = await supabase
    .from("game_collections" as UntypedFrom)
    .update(updatePayload)
    .eq("user_id", userId)
    .eq("slug", slug)
    .select("id, slug")
    .single();

  if (error) throw error;
  return data as unknown as { id: string; slug: string };
}

/**
 * Supprime une collection par userId + slug. La cascade supprime les items.
 */
export async function deleteCollection(userId: string, slug: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("game_collections" as UntypedFrom)
    .delete()
    .eq("user_id", userId)
    .eq("slug", slug);

  if (error) throw error;
}

/**
 * Ajoute un jeu à une collection avec position automatique.
 * Rejette si le jeu est déjà présent (contrainte UNIQUE collection_id + game_id).
 */
export async function addItem(
  userId: string,
  collectionSlug: string,
  input: AddCollectionItemInput
): Promise<void> {
  const supabase = await createServerClient();
  const collectionId = await resolveCollectionId(supabase, userId, collectionSlug);

  // Count existing items to determine next position
  const { data: existingItems, error: itemsError } = await supabase
    .from("game_collection_items" as UntypedFrom)
    .select("id")
    .eq("collection_id", collectionId);

  if (itemsError) throw itemsError;

  const position = calculateNextPosition((existingItems || []) as unknown as CollectionItem[]);

  const { error: insertError } = await supabase
    .from("game_collection_items" as UntypedFrom)
    .insert({
      collection_id: collectionId,
      game_id: input.gameId,
      position,
      note: input.note || null,
    });

  if (insertError) throw insertError;
}

/**
 * Retire un jeu d'une collection et réordonne les positions restantes.
 */
export async function removeItem(
  userId: string,
  collectionSlug: string,
  gameId: string
): Promise<void> {
  const supabase = await createServerClient();
  const collectionId = await resolveCollectionId(supabase, userId, collectionSlug);

  const { error: deleteError } = await supabase
    .from("game_collection_items" as UntypedFrom)
    .delete()
    .eq("collection_id", collectionId)
    .eq("game_id", gameId);

  if (deleteError) throw deleteError;

  // Reorder remaining items to maintain contiguous positions (0, 1, 2, ...)
  const { data: remainingItems, error: remainingError } = await supabase
    .from("game_collection_items" as UntypedFrom)
    .select("id, position")
    .eq("collection_id", collectionId)
    .order("position", { ascending: true });

  if (remainingError) throw remainingError;

  for (const [index, item] of (
    (remainingItems || []) as unknown as Array<{ id: string; position: number }>
  ).entries()) {
    if (item.position !== index) {
      const { error } = await supabase
        .from("game_collection_items" as UntypedFrom)
        .update({ position: index })
        .eq("id", item.id);
      if (error) throw error;
    }
  }
}

/**
 * Réordonne les jeux d'une collection selon les positions fournies.
 */
export async function reorderItems(
  userId: string,
  collectionSlug: string,
  items: Array<{ gameId: string; position: number }>
): Promise<void> {
  const supabase = await createServerClient();
  const collectionId = await resolveCollectionId(supabase, userId, collectionSlug);

  for (const item of items) {
    const { error } = await supabase
      .from("game_collection_items" as UntypedFrom)
      .update({ position: item.position })
      .eq("collection_id", collectionId)
      .eq("game_id", item.gameId);

    if (error) throw error;
  }
}
