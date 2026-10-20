import { describe, it, expect, vi } from "vitest";
import { createTranslator, type AbstractIntlMessages } from "next-intl";
import fr from "@/messages/legal/fr.json";
import en from "@/messages/legal/en.json";
import { buildLegalRichTags } from "@/components/legal/legalRichTags";

vi.mock("@/i18n/navigation", () => ({ Link: "a" }));

const PAGES = ["mentionsLegales", "confidentialite", "cookies", "cgv", "cgu"] as const;

const BLOCK_PREFIXES = ["h2", "h3", "p", "ul", "table"];

function flattenKeys(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

function richMessageKeys(messages: Record<string, unknown>): string[] {
  return flattenKeys(messages).filter((key) => !key.includes(".table_"));
}

describe("legal messages", () => {
  it("fr and en define exactly the same keys", () => {
    expect(flattenKeys(en).sort()).toEqual(flattenKeys(fr).sort());
  });

  it("keeps the same block order in both locales", () => {
    for (const page of PAGES) {
      expect(Object.keys(en[page].content)).toEqual(Object.keys(fr[page].content));
    }
  });

  it("only uses block types known by LegalDocument", () => {
    for (const page of PAGES) {
      for (const blockKey of Object.keys(fr[page].content)) {
        expect(BLOCK_PREFIXES).toContain(blockKey.split("_")[0]);
      }
    }
  });

  it.each([["fr", fr], ["en", en]] as const)("every %s message formats with the shared tags", (locale, messages) => {
    const errors: string[] = [];
    const t = createTranslator({
      locale,
      messages: messages as AbstractIntlMessages,
      onError: (error) => errors.push(error.message),
    });
    const tags = buildLegalRichTags(t);

    for (const key of richMessageKeys(messages)) t.rich(key, tags);

    expect(errors).toEqual([]);
  });
});
