/**
 * Supabase admin client for Edge Functions.
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the function env.
 * These secrets are set automatically when an Edge Function is deployed.
 *
 * ⚠️ This client bypasses RLS — use only inside Edge Functions logic
 * that has been authorised separately.
 */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables");
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: { schema: "public" },
  });

  return cachedClient;
}
