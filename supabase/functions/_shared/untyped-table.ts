/**
 * Access a Supabase table without relying on generated types.
 *
 * Edge Functions don't ship the generated Database types, so every
 * table access goes through this helper for clarity.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function untypedTable(supabase: SupabaseClient, name: string): any {
  return (supabase as unknown as { from: (n: string) => unknown }).from(name);
}
