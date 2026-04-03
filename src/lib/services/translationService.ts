import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import {
  type EntityType,
  type EntityTranslationDetail,
  type EntityTranslationLangDetail,
  type TranslationMissingItem,
  type TranslationStats,
  type TranslationStatus,
  TRANSLATION_TABLE_MAP,
  ENTITY_TABLE_MAP,
  FK_COLUMN_MAP,
  IDENTIFIER_FIELD_MAP,
  REQUIRED_FIELDS,
  EDITABLE_FIELDS,
} from "@/types/admin-translations";

/** Cast supabase to bypass generated types for translation tables. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (supabase: SupabaseClient) => supabase as any;

const PAGE_SIZE = 1000;

/** Fetch all rows by paginating in batches of 1000 to bypass Supabase default limit. */
async function fetchAllRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildQuery: () => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const allRows: unknown[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows;
}

/**
 * Determine translation status from a row's required fields.
 */
export function classifyStatus(
  row: Record<string, string | null> | null,
  requiredFields: string[]
): TranslationStatus {
  if (!row) return "missing";
  const filled = requiredFields.filter((f) => row[f] && row[f]!.trim() !== "");
  if (filled.length === 0) return "missing";
  if (filled.length === requiredFields.length) return "complete";
  return "partial";
}

/**
 * Retrieves entities with missing translations using SQL-level filtering and pagination.
 * Uses the `get_missing_translations` RPC to filter at the database level,
 * ensuring only entities with genuinely incomplete translations are returned.
 */
export async function getMissingTranslations(params: {
  supabase: SupabaseClient;
  entityType: EntityType;
  languages: string[];
  page: number;
  limit: number;
  search?: string;
}): Promise<{ items: TranslationMissingItem[]; totalCount: number }> {
  const { supabase, entityType, languages, page, limit, search } = params;
  const client = db(supabase);
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];
  const requiredFields = REQUIRED_FIELDS[entityType];
  const editableFields = EDITABLE_FIELDS[entityType];

  // 1. Use the SQL function to get only entities with missing translations
  const { data: rpcRows, error: rpcError } = await client.rpc("get_missing_translations", {
    p_entity_type: entityType,
    p_languages: languages,
    p_required_fields: requiredFields,
    p_page: page,
    p_limit: limit,
    p_search: search?.trim() || null,
  });

  if (rpcError) {
    logger.error("Error calling get_missing_translations RPC", { error: rpcError, entityType });
    throw new Error("Failed to fetch missing translations");
  }

  if (!rpcRows || rpcRows.length === 0) return { items: [], totalCount: 0 };

  // totalCount is returned on every row by the SQL function
  const totalCount: number = Number(rpcRows[0].total_count) || 0;
  const entityIds = rpcRows.map((r: { entity_id: string }) => r.entity_id);
  const identifierById = new Map<string, string>(
    rpcRows.map((r: { entity_id: string; identifier: string }) => [r.entity_id, r.identifier])
  );

  // 2. Fetch translations for these entities (small set — only the current page)
  const translationSelect = [fkColumn, "language_code", ...editableFields].join(", ");
  const translationsByEntity = new Map<string, Map<string, Record<string, string | null>>>();

  for (let i = 0; i < entityIds.length; i += 200) {
    const batch = entityIds.slice(i, i + 200);
    const { data: rows } = await client
      .from(translationTable)
      .select(translationSelect)
      .in(fkColumn, batch);
    for (const row of rows || []) {
      const eid = row[fkColumn] as string;
      if (!translationsByEntity.has(eid)) translationsByEntity.set(eid, new Map());
      translationsByEntity.get(eid)!.set(row.language_code, row);
    }
  }

  // 3. Build missing items from the SQL-filtered entities
  const items: TranslationMissingItem[] = [];
  for (const eid of entityIds) {
    const langMap = translationsByEntity.get(eid);

    // Find best source language
    let sourceLang = "";
    let sourceFields: Record<string, string> = {};
    if (langMap) {
      const enRow = langMap.get("en");
      if (enRow) {
        const fields = extractFields(enRow, editableFields);
        if (Object.keys(fields).length > 0) {
          sourceLang = "en";
          sourceFields = fields;
        }
      }
      if (!sourceLang) {
        for (const [lang, row] of langMap) {
          const fields = extractFields(row, editableFields);
          if (Object.keys(fields).length > 0) {
            sourceLang = lang;
            sourceFields = fields;
            break;
          }
        }
      }
    }

    // Find missing languages
    const missingLangs: string[] = [];
    for (const lang of languages) {
      const row = langMap?.get(lang) ?? null;
      if (classifyStatus(row, requiredFields) !== "complete") missingLangs.push(lang);
    }

    items.push({
      entityId: eid,
      identifier: identifierById.get(eid) || eid,
      sourceText: sourceFields,
      sourceLang: sourceLang || languages[0],
      missingLangs,
    });
  }

  return { items, totalCount };
}

/** Extract non-empty editable fields from a translation row */
function extractFields(
  row: Record<string, string | null>,
  editableFields: string[]
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const f of editableFields) {
    if (row[f]) fields[f] = row[f]!;
  }
  return fields;
}

/** Helper: empty stats row for a given entity type and language. */
function emptyStats(entityType: EntityType, lang: string): TranslationStats {
  return {
    entityType,
    language: lang,
    total: 0,
    complete: 0,
    partial: 0,
    missing: 0,
    percentage: 100, // Nothing to translate = 100% done
  };
}

/** Compute stats for a single entity type across all languages. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function statsForEntityType(client: any, entityType: EntityType, languages: string[]) {
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];
  const requiredFields = REQUIRED_FIELDS[entityType];
  const selectFields = [fkColumn, "language_code", ...EDITABLE_FIELDS[entityType]].join(", ");

  // Fetch all translations — we derive entity count from entities that have at least one row
  let allTranslations;
  try {
    allTranslations = await fetchAllRows(() => client.from(translationTable).select(selectFields));
  } catch (err) {
    logger.error("Error fetching translation stats", { error: err, entityType });
    return languages.map((l) => emptyStats(entityType, l));
  }

  // Group by entity ID → { lang → row }
  const byEntity = new Map<string, Map<string, Record<string, string | null>>>();
  for (const row of allTranslations || []) {
    const eid = row[fkColumn] as string;
    if (!byEntity.has(eid)) byEntity.set(eid, new Map());
    byEntity.get(eid)!.set(row.language_code, row);
  }

  // Only count entities that have at least one usable source translation
  const entityIds = [...byEntity.keys()];
  const totalCount = entityIds.length;
  if (totalCount === 0) return languages.map((l) => emptyStats(entityType, l));

  const results: TranslationStats[] = [];
  for (const lang of languages) {
    let complete = 0,
      partial = 0,
      missing = 0;
    for (const eid of entityIds) {
      const langMap = byEntity.get(eid)!;
      const row = langMap.get(lang) ?? null;
      const s = classifyStatus(row, requiredFields);
      if (s === "complete") complete++;
      else if (s === "partial") partial++;
      else missing++;
    }
    results.push({
      entityType,
      language: lang,
      total: totalCount,
      complete,
      partial,
      missing,
      percentage: totalCount > 0 ? Math.round((complete / totalCount) * 100) : 0,
    });
  }
  return results;
}

/**
 * Computes translation statistics for all 10 entity types and each language.
 */
export async function getTranslationStats(params: {
  supabase: SupabaseClient;
  languages: string[];
}): Promise<TranslationStats[]> {
  const client = db(params.supabase);
  const entityTypes = Object.keys(ENTITY_TABLE_MAP) as EntityType[];
  const results: TranslationStats[] = [];
  for (const et of entityTypes) {
    results.push(...(await statsForEntityType(client, et, params.languages)));
  }
  return results;
}

/**
 * Retrieves the source text for an entity in the best available language.
 * Prefers English ("en") if available, otherwise picks the first found.
 */
export async function getSourceText(params: {
  supabase: SupabaseClient;
  entityType: EntityType;
  entityId: string;
  excludeLang: string;
}): Promise<{ sourceLang: string; fields: Record<string, string> } | null> {
  const { supabase, entityType, entityId, excludeLang } = params;
  const client = db(supabase);
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];
  const editableFields = EDITABLE_FIELDS[entityType];

  const selectFields = ["language_code", ...editableFields].join(", ");
  const { data: rows, error } = await client
    .from(translationTable)
    .select(selectFields)
    .eq(fkColumn, entityId)
    .neq("language_code", excludeLang);

  if (error) {
    logger.error("Error fetching source text", { error, entityType, entityId });
    throw new Error("Failed to fetch source text");
  }

  if (!rows || rows.length === 0) return null;

  // Prefer English, otherwise first row
  const enRow = rows.find((r: Record<string, string>) => r.language_code === "en");
  const bestRow = enRow || rows[0];

  const fields: Record<string, string> = {};
  for (const f of editableFields) {
    if (bestRow[f]) fields[f] = bestRow[f];
  }

  if (Object.keys(fields).length === 0) return null;

  return { sourceLang: bestRow.language_code, fields };
}

/**
 * Inserts or updates a translation row using upsert with ON CONFLICT
 * on the unique constraint (entity_fk, language_code).
 */
export async function upsertTranslation(params: {
  supabase: SupabaseClient;
  entityType: EntityType;
  entityId: string;
  targetLang: string;
  fields: Record<string, string>;
}): Promise<void> {
  const { supabase, entityType, entityId, targetLang, fields } = params;
  const client = db(supabase);
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];

  const row = {
    [fkColumn]: entityId,
    language_code: targetLang,
    ...fields,
  };

  const { error } = await client
    .from(translationTable)
    .upsert(row, { onConflict: `${fkColumn},language_code` });

  if (error) {
    logger.error("Error upserting translation", { error, entityType, entityId, targetLang });
    throw new Error("Failed to upsert translation");
  }
}

/**
 * Returns the full translation detail for a single entity across all languages.
 * For each language, returns the status and all editable field values.
 */
export async function getEntityTranslationDetail(params: {
  supabase: SupabaseClient;
  entityType: EntityType;
  entityId: string;
  languages: string[];
}): Promise<EntityTranslationDetail | null> {
  const { supabase, entityType, entityId, languages } = params;
  const client = db(supabase);
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const entityTable = ENTITY_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];
  const identifierField = IDENTIFIER_FIELD_MAP[entityType];
  const editableFields = EDITABLE_FIELDS[entityType];
  const requiredFields = REQUIRED_FIELDS[entityType];

  // Fetch entity identifier
  const { data: entity, error: entityError } = await client
    .from(entityTable)
    .select(`id, ${identifierField}`)
    .eq("id", entityId)
    .single();

  if (entityError || !entity) return null;

  // Fetch all translations for this entity
  const selectFields = ["language_code", ...editableFields].join(", ");
  const { data: rows, error: trError } = await client
    .from(translationTable)
    .select(selectFields)
    .eq(fkColumn, entityId);

  if (trError) {
    logger.error("Error fetching entity translation detail", {
      error: trError,
      entityType,
      entityId,
    });
    throw new Error("Failed to fetch entity translation detail");
  }

  // Build a map lang → row
  const rowByLang = new Map<string, Record<string, string | null>>();
  for (const row of rows || []) {
    rowByLang.set(row.language_code, row);
  }

  // Build detail per language
  const langDetails: EntityTranslationLangDetail[] = languages.map((lang) => {
    const row = rowByLang.get(lang) ?? null;
    const status = classifyStatus(row, requiredFields);
    const fields: Record<string, string | null> = {};
    for (const f of editableFields) {
      fields[f] = row?.[f] ?? null;
    }
    return { language: lang, status, fields };
  });

  return {
    entityId,
    identifier: entity[identifierField] || entityId,
    languages: langDetails,
  };
}
