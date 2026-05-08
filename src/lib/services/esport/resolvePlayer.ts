import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

interface PlayerLookupRow {
  id: string;
}

/**
 * Resolve a player's local UUID from a PandaScore numeric ID.
 * Returns `null` when the player isn't in the DB yet.
 */
export async function resolvePlayerLocalId(pandascoreId: number): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_players" as UntypedFrom)
    .select("id")
    .eq("pandascore_id", pandascoreId)
    .limit(1);

  if (error) throw error;
  const rows = (data as PlayerLookupRow[] | null) ?? [];
  return rows[0]?.id ?? null;
}
