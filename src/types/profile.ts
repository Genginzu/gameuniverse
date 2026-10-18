// Types pour les profils utilisateur

import type { Database } from "@/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Account profile. `email` is NOT a profiles column (issue #375): it lives in
 * auth.users and is injected for the caller's OWN profile only (from
 * auth.getUser()), so it is optional/nullable here.
 */
export type Profile = ProfileRow & { email?: string | null };

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}
