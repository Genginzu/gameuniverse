import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { XboxAuthContext } from "@/types/platform-connection";
import { getValidAccessToken } from "./refresh";
import { authorizeXboxLive } from "./xboxLive";

export async function getXboxAuthForPlayer(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<XboxAuthContext | null> {
  const microsoftAccessToken = await getValidAccessToken(supabase, playerId, "xbox");
  if (!microsoftAccessToken) return null;
  return authorizeXboxLive(microsoftAccessToken);
}
