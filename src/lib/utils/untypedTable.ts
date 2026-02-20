import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Access a Supabase table that is not yet in the generated Database types.
 *
 * This centralises the single unavoidable `any` cast so that consuming
 * code stays fully typed.
 *
 * Once the table is added to the generated types, usages of this helper
 * can be replaced with a direct `.from("table_name")` call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function untypedTable(supabase: SupabaseClient<any>, name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from(name) as ReturnType<SupabaseClient<any>["from"]>;
}
