import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import {
  type EntityType,
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
 * Retrieves entities with missing or incomplete translations for a target language.
 * Uses a two-step approach: fetch entities, then LEFT JOIN with translations.
 */
export async function getMissingTranslations(params: {
  supabase: SupabaseClient;
  entityType: EntityType;
  targetLang: string;
  page: number;
  limit: number;
  search?: string;
}): Promise<{ items: TranslationMissingItem[]; totalCount: number }> {
  const { supabase, entityType, targetLang, page, limit, search } = params;
  const client = db(supabase);
  const entityTable = ENTITY_TABLE_MAP[entityType];
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];
  const identifierField = IDENTIFIER_FIELD_MAP[entityType];
  const requiredFields = REQUIRED_FIELDS[entityType];
  const editableFields = EDITABLE_FIELDS[entityType];

  const translationSelect = [fkColumn, "language_code", ...editableFields].join(", ");

  // Get all translations for targetLang to identify missing/incomplete
  const { data: allTranslations, error: trError } = await client
    .from(translationTable)
    .select(translationSelect)
    .eq("language_code", targetLang);
  if (trError) {
    logger.error("Error fetching translations", { error: trError, entityType, targetLang });
    throw new Error("Failed to fetch translations");
  }
  const targetMap = new Map<string, Record<string, string | null>>();
  for (const row of allTranslations || []) targetMap.set(row[fkColumn], row);

  // Get entities, optionally filtered by search
  let entityQuery = client.from(entityTable).select(`id, ${identifierField}`);
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    const searchOr = editableFields.map((f) => `${f}.ilike.${term}`).join(",");
    const { data: matchTr } = await client.from(translationTable).select(fkColumn).or(searchOr);
    const { data: matchEnt } = await client
      .from(entityTable)
      .select("id")
      .ilike(identifierField, term);
    const ids = [
      ...new Set([
        ...(matchTr || []).map((r: Record<string, string>) => r[fkColumn]),
        ...(matchEnt || []).map((e: { id: string }) => e.id),
      ]),
    ];
    if (ids.length === 0) return { items: [], totalCount: 0 };
    entityQuery = entityQuery.in("id", ids);
  }
  const { data: entities, error: entityError } = await entityQuery;
  if (entityError) {
    logger.error("Error fetching entities", { error: entityError, entityType });
    throw new Error("Failed to fetch entities");
  }

  // Step 3: Build source map (prefer "en") from translations in other languages
  const { data: sourceTrs } = await client
    .from(translationTable)
    .select(translationSelect)
    .neq("language_code", targetLang);

  const sourceMap = new Map<string, { lang: string; fields: Record<string, string> }>();
  for (const row of sourceTrs || []) {
    const eid = row[fkColumn] as string;
    const existing = sourceMap.get(eid);
    if (existing && !(row.language_code === "en" && existing.lang !== "en")) continue;
    const fields: Record<string, string> = {};
    for (const f of editableFields) {
      if (row[f]) fields[f] = row[f];
    }
    if (Object.keys(fields).length > 0) sourceMap.set(eid, { lang: row.language_code, fields });
  }

  // Step 4: Filter to only missing/incomplete, then paginate
  const allItems: TranslationMissingItem[] = [];
  for (const entity of entities || []) {
    const targetRow = targetMap.get(entity.id) || null;
    const status = classifyStatus(targetRow, requiredFields);
    if (status === "complete") continue;
    const source = sourceMap.get(entity.id);
    const targetText: Record<string, string> = {};
    if (targetRow)
      for (const f of editableFields) {
        if (targetRow[f]) targetText[f] = targetRow[f];
      }
    allItems.push({
      entityId: entity.id,
      identifier: entity[identifierField] || entity.id,
      sourceText: source?.fields || {},
      targetText,
      sourceLang: source?.lang || "",
      status,
    });
  }
  const totalCount = allItems.length;
  return { items: allItems.slice((page - 1) * limit, (page - 1) * limit + limit), totalCount };
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
    percentage: 0,
  };
}

/** Compute stats for a single entity type across all languages. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function statsForEntityType(client: any, entityType: EntityType, languages: string[]) {
  const entityTable = ENTITY_TABLE_MAP[entityType];
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];
  const requiredFields = REQUIRED_FIELDS[entityType];
  const selectFields = [fkColumn, ...EDITABLE_FIELDS[entityType]].join(", ");

  const { count: total, error: countError } = await client
    .from(entityTable)
    .select("id", { count: "exact", head: true });
  if (countError) {
    logger.error("Error counting entities", { error: countError, entityType });
    return languages.map((l) => emptyStats(entityType, l));
  }
  const totalCount = total || 0;
  if (totalCount === 0) return languages.map((l) => emptyStats(entityType, l));

  const { data: entityIds } = await client.from(entityTable).select("id");
  const results: TranslationStats[] = [];
  for (const lang of languages) {
    const { data: translations, error: trError } = await client
      .from(translationTable)
      .select(selectFields)
      .eq("language_code", lang);
    if (trError) {
      logger.error("Error fetching translation stats", { error: trError, entityType, lang });
      continue;
    }
    const trMap = new Map<string, Record<string, string | null>>();
    for (const row of translations || []) trMap.set(row[fkColumn], row);

    let complete = 0,
      partial = 0,
      missing = 0;
    for (const entity of entityIds || []) {
      const s = classifyStatus(trMap.get(entity.id) || null, requiredFields);
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
      percentage: Math.round((complete / totalCount) * 100),
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
