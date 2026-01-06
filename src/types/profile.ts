// Types pour les profils utilisateur

import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}
