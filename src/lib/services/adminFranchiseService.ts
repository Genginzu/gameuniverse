/**
 * Admin CRUD of franchises (`/api/admin/franchises`). IGDB keeps writing the
 * name and slug of IGDB franchises on sync; descriptions are admin-only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { ilikeAnyFilter } from "@/lib/utils/postgrestFilter";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { FranchiseFormData, franchiseQuerySchema } from "@/lib/validations/admin-franchise-form";
import type { AdminFranchise, AdminFranchiseListItem } from "@/types/admin-franchises";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

interface FranchiseRow {
  id: string;
  igdb_id: number | null;
  slug: string;
  name: string;
  game_franchises?: Array<{ count: number }>;
  franchise_translations?: Array<{ language_code: string; description: string | null }>;
}

const DETAIL_COLUMNS = "id, igdb_id, slug, name, franchise_translations(language_code, description)";

export async function listAdminFranchises(
  supabase: Client,
  query: z.infer<typeof franchiseQuerySchema>
): Promise<{ franchises: AdminFranchiseListItem[]; totalCount: number }> {
  const offset = (query.page - 1) * query.limit;
  let request = untypedTable(supabase, "franchises")
    .select("id, igdb_id, slug, name, game_franchises(count)", { count: "exact" })
    .order(query.sort_by, { ascending: query.sort_order === "asc" })
    .range(offset, offset + query.limit - 1);
  if (query.search?.trim()) request = request.or(ilikeAnyFilter(["name", "slug"], query.search));
  const { data, error, count } = await request;
  if (error) throw new Error(`franchises: ${error.message}`);
  return {
    franchises: ((data ?? []) as FranchiseRow[]).map((row) => ({
      id: row.id,
      igdbId: row.igdb_id,
      slug: row.slug,
      name: row.name,
      gameCount: row.game_franchises?.[0]?.count ?? 0,
    })),
    totalCount: count ?? 0,
  };
}

function toAdminFranchise(row: FranchiseRow): AdminFranchise {
  return {
    id: row.id,
    igdbId: row.igdb_id,
    slug: row.slug,
    name: row.name,
    translations: (row.franchise_translations ?? []).map((translation) => ({
      language_code: translation.language_code,
      description: translation.description ?? "",
    })),
  };
}

export async function getAdminFranchise(supabase: Client, id: string): Promise<AdminFranchise | null> {
  const { data, error } = await untypedTable(supabase, "franchises").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`franchises: ${error.message}`);
  return data ? toAdminFranchise(data as FranchiseRow) : null;
}

async function saveDescriptions(supabase: Client, franchiseId: string, form: FranchiseFormData) {
  const rows = form.translations.map((translation) => ({
    franchise_id: franchiseId,
    language_code: translation.language_code,
    description: translation.description?.trim() || null,
  }));
  if (rows.length === 0) return;
  const { error } = await untypedTable(supabase, "franchise_translations").upsert(rows, {
    onConflict: "franchise_id,language_code",
  });
  if (error) throw new Error(`franchise_translations: ${error.message}`);
}

/** Inserts or updates a franchise; returns null on a slug conflict. */
export async function saveAdminFranchise(
  supabase: Client,
  form: FranchiseFormData,
  id?: string
): Promise<AdminFranchise | null> {
  const values = { name: form.name.trim(), slug: form.slug, updated_at: new Date().toISOString() };
  const request = id
    ? untypedTable(supabase, "franchises").update(values).eq("id", id)
    : untypedTable(supabase, "franchises").insert(values);
  const { data, error } = await request.select("id").single();
  if (error?.code === "23505") return null;
  if (error) throw new Error(`franchises: ${error.message}`);
  const franchiseId = (data as { id: string }).id;
  await saveDescriptions(supabase, franchiseId, form);
  return getAdminFranchise(supabase, franchiseId);
}

export async function deleteAdminFranchise(supabase: Client, id: string): Promise<void> {
  const { error } = await untypedTable(supabase, "franchises").delete().eq("id", id);
  if (error) throw new Error(`franchises: ${error.message}`);
}
