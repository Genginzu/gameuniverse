import { describe, it, expect } from "vitest";
import {
  parseTranslationPageSize,
  planTranslationBatches,
} from "@/lib/utils/translationBatchPlan";
import type { TranslationMissingItem } from "@/types/admin-translations";

function item(entityId: string, missingLangs: string[]): TranslationMissingItem {
  return { entityId, identifier: entityId, sourceText: {}, sourceLang: "en", missingLangs };
}

describe("planTranslationBatches", () => {
  it("sends one request per target language", () => {
    const plan = planTranslationBatches([item("a", ["fr"]), item("b", ["fr", "en"])]);
    expect(plan).toEqual([
      { targetLang: "fr", entityIds: ["a", "b"] },
      { targetLang: "en", entityIds: ["b"] },
    ]);
  });

  it("splits large selections into chunks, keeping the selection order", () => {
    const items = Array.from({ length: 12 }, (_, i) => item(`e${i}`, ["fr"]));
    const plan = planTranslationBatches(items, 5);
    expect(plan.map((r) => r.entityIds.length)).toEqual([5, 5, 2]);
    expect(plan.flatMap((r) => r.entityIds)).toEqual(items.map((i) => i.entityId));
  });

  it("returns nothing for an empty or already complete selection", () => {
    expect(planTranslationBatches([])).toEqual([]);
    expect(planTranslationBatches([item("a", [])])).toEqual([]);
  });
});

describe("parseTranslationPageSize", () => {
  it("accepts the offered sizes", () => {
    expect(parseTranslationPageSize("100")).toBe(100);
    expect(parseTranslationPageSize("40")).toBe(40);
  });

  it("falls back to 20 for anything else", () => {
    expect(parseTranslationPageSize(null)).toBe(20);
    expect(parseTranslationPageSize("50")).toBe(20);
    expect(parseTranslationPageSize("1000")).toBe(20);
  });
});
