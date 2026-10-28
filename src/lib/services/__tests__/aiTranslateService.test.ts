import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";

const mockGenerateText = vi.fn();

vi.mock("ai", () => ({
  generateText: (args: unknown) => mockGenerateText(args),
  Output: { object: ({ schema }: { schema: z.ZodType }) => ({ schema }) },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const { translateFields } = await import("@/lib/services/aiTranslateService");

function schemaPassedToModel(): z.ZodType {
  return mockGenerateText.mock.calls[0][0].output.schema;
}

beforeEach(() => {
  mockGenerateText.mockReset().mockResolvedValue({ output: { name: "Super Nintendo" } });
});

describe("translateFields", () => {
  it("only requires the fields sent for translation", async () => {
    await translateFields({
      model: "openai/gpt-5.4-nano",
      sourceLang: "en",
      targetLang: "fr",
      entityType: "platforms",
      fields: { name: "Super Nintendo" },
    });

    const schema = schemaPassedToModel();
    expect(schema.safeParse({ name: "Super Nintendo" }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("uses the model chosen by the caller", async () => {
    await translateFields({
      model: "anthropic/claude-haiku-4.5",
      sourceLang: "en",
      targetLang: "fr",
      entityType: "platforms",
      fields: { name: "Super Nintendo" },
    });

    expect(mockGenerateText.mock.calls[0][0].model).toBe("anthropic/claude-haiku-4.5");
  });
});
