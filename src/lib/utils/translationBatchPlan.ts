import type { TranslationMissingItem } from "@/types/admin-translations";

/**
 * Entities per translate-batch request. The route translates them one after
 * another; 5 x ~11 s (DeepSeek) stays well under its 300 s maxDuration, even
 * with a slow call or two.
 */
export const TRANSLATION_BATCH_CHUNK_SIZE = 5;

/** Page sizes offered on the "to translate" list. */
export const TRANSLATION_PAGE_SIZES = [20, 40, 60, 80, 100] as const;
export const DEFAULT_TRANSLATION_PAGE_SIZE = TRANSLATION_PAGE_SIZES[0];

export interface TranslationBatchRequest {
  targetLang: string;
  entityIds: string[];
}

/**
 * Splits a selection into translate-batch requests: one target language per
 * request (the route takes a single targetLang), at most chunkSize entities each.
 * Order: languages as first met, then entities in selection order.
 */
export function planTranslationBatches(
  items: TranslationMissingItem[],
  chunkSize = TRANSLATION_BATCH_CHUNK_SIZE
): TranslationBatchRequest[] {
  const idsByLang = new Map<string, string[]>();
  for (const item of items) {
    for (const lang of item.missingLangs) {
      idsByLang.set(lang, [...(idsByLang.get(lang) ?? []), item.entityId]);
    }
  }

  const requests: TranslationBatchRequest[] = [];
  for (const [targetLang, ids] of idsByLang) {
    for (let i = 0; i < ids.length; i += chunkSize) {
      requests.push({ targetLang, entityIds: ids.slice(i, i + chunkSize) });
    }
  }
  return requests;
}

/** Reads the page size from the URL, falling back to the default for any other value. */
export function parseTranslationPageSize(raw: string | null): number {
  const value = Number(raw);
  return (TRANSLATION_PAGE_SIZES as readonly number[]).includes(value)
    ? value
    : DEFAULT_TRANSLATION_PAGE_SIZE;
}
