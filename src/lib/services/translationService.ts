import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import {
  type EntityType,
  type EntityTranslationDetail,
  type EntityTranslationLangDetail,
  type TranslationMissingItem,
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
