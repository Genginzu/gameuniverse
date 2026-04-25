import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateText } from "ai";

vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: { object: ({ schema }: any) => schema },
}));
vi.mock("@/types/admin-translations", () => ({
  EDITABLE_FIELDS: { games: ["title", "description"], characters: ["name", "description"] },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { translateFields } from "@/lib/services/aiTranslateService";

const mockGenerateText = vi.mocked(generateText);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("translateFields", () => {
  it("translates fields successfully", async () => {
    mockGenerateText.mockResolvedValue({
      output: { title: "Translated Title", description: "Translated Desc" },
    } as any);
    const result = await translateFields({
      sourceLang: "fr",
      targetLang: "en",
      entityType: "games",
      fields: { title: "Titre", description: "Desc" },
    });
    expect(result).toEqual({ title: "Translated Title", description: "Translated Desc" });
  });

  it("throws when AI returns no output", async () => {
    mockGenerateText.mockResolvedValue({ output: null } as any);
    await expect(
      translateFields({
        sourceLang: "fr",
        targetLang: "en",
        entityType: "games",
        fields: { title: "T" },
      })
    ).rejects.toThrow("AI returned no structured output");
  });

  it("throws on AI failure", async () => {
    mockGenerateText.mockRejectedValue(new Error("API down"));
    await expect(
      translateFields({
        sourceLang: "fr",
        targetLang: "en",
        entityType: "games",
        fields: { title: "T" },
      })
    ).rejects.toThrow("AI translation failed: API down");
  });
});
