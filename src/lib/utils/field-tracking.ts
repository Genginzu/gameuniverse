import type { TrackableField } from "@/types/admin-games";

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
