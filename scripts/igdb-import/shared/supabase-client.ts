/**
 * Supabase client for standalone scripts (outside Next.js request context)
 * Uses service role key for full database access without RLS restrictions
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types";

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Creates a Supabase client for use in scripts.
 * Uses the service role key for admin access (bypasses RLS).
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (for admin access) or NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createScriptClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key for scripts (bypasses RLS), fallback to anon key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!supabaseKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Reset the client (useful for testing)
 */
export function resetScriptClient(): void {
  supabaseClient = null;
}
