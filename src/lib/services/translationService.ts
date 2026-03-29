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
 * Retrieves entities that have at least one translation but are missing
 * translations in one or more supported languages.
 * For each entity, determines the source language (prefers "en") and lists
 * all languages that still need translation.
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
  const entityTable = ENTITY_TABLE_MAP[entityType];
  const translationTable = TRANSLATION_TABLE_MAP[entityType];
  const fkColumn = FK_COLUMN_MAP[entityType];
  const identifierField = IDENTIFIER_FIELD_MAP[entityType];
  const requiredFields = REQUIRED_FIELDS[entityType];
  const editableFields = EDITABLE_FIELDS[entityType];

  const translationSelect = [fkColumn, "language_code", ...editableFields].join(", ");

  // Fetch all translations for this entity type
  const { data: allTranslations, error: trError } = await client
    .from(translationTable)
    .select(translationSelect);
  if (trError) {
    logger.error("Error fetching translations", { error: trError, entityType });
    throw new Error("Failed to fetch translations");
  }

  // Group translations by entity ID → { lang → row }
  const translationsByEntity = new Map<string, Map<string, Record<string, string | null>>>();
  for (const row of allTranslations || []) {
    const eid = row[fkColumn] as string;
    if (!translationsByEntity.has(eid)) translationsByEntity.set(eid, new Map());
    translationsByEntity.get(eid)!.set(row.language_code, row);
  }

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

  // Build items: for each entity, find source lang and missing langs
  const allItems: TranslationMissingItem[] = [];
  for (const entity of entities || []) {
    const langMap = translationsByEntity.get(entity.id);
    if (!langMap || langMap.size === 0) continue; // no translations at all — skip (nothing to translate from)

    // Find best source: prefer "en", then first complete row
    let sourceLang = "";
    let sourceFields: Record<string, string> = {};
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
    if (!sourceLang) continue; // no usable source text

    // Determine which languages are missing or incomplete
    const missingLangs: string[] = [];
    for (const lang of languages) {
      if (lang === sourceLang) {
        // Source lang itself might still be incomplete in required fields
        const row = langMap.get(lang);
        const status = classifyStatus(row || null, requiredFields);
        if (status !== "complete") missingLangs.push(lang);
        continue;
      }
      const row = langMap.get(lang);
      const status = classifyStatus(row || null, requiredFields);
      if (status !== "complete") missingLangs.push(lang);
    }

    if (missingLangs.length === 0) continue; // fully translated

    allItems.push({
      entityId: entity.id,
      identifier: entity[identifierField] || entity.id,
      sourceText: sourceFields,
      sourceLang,
      missingLangs,
    });
  }

  const totalCount = allItems.length;
  return { items: allItems.slice((page - 1) * limit, (page - 1) * limit + limit), totalCount };
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
