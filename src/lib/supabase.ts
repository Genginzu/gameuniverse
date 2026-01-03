import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Client pour les composants côté client
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Export des types générés automatiquement
export type { Database };
