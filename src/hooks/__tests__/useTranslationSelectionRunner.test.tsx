import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTranslationSelectionRunner } from "@/hooks/useTranslationSelectionRunner";
import type { BatchProgressEvent, TranslationMissingItem } from "@/types/admin-translations";

function item(entityId: string, missingLangs: string[]): TranslationMissingItem {
  return { entityId, identifier: entityId, sourceText: {}, sourceLang: "en", missingLangs };
}

/** Fake translate-batch: reports each entity, failing the ids listed in `failing`. */
function fakeBatch(failing: string[] = []) {
  return vi.fn(
    async (ids: string[], onProgress: (e: BatchProgressEvent) => void) => {
      for (const entityId of ids) {
        onProgress({ entityId, status: failing.includes(entityId) ? "error" : "success" });
      }
      return { total: ids.length, succeeded: ids.length, failed: 0 };
    }
  );
}

describe("useTranslationSelectionRunner", () => {
  it("translates each (entity, language) pair once, one request after another", async () => {
    const translateBatch = fakeBatch(["b"]);
    const { result } = renderHook(() => useTranslationSelectionRunner(translateBatch));

    await act(() => result.current.run([item("a", ["fr"]), item("b", ["fr", "en"])]));

    expect(translateBatch.mock.calls.map((c) => [c[0], c[3]])).toEqual([
      [["a", "b"], "fr"],
      [["b"], "en"],
    ]);
    expect(result.current).toMatchObject({
      isRunning: false,
      total: 3,
      processed: 3,
      succeeded: 1,
      failed: 2,
    });
    expect(result.current.pendingIds.size).toBe(0);
  });

  it("stops after the current request when cancelled", async () => {
    const translateBatch = fakeBatch();
    const { result } = renderHook(() => useTranslationSelectionRunner(translateBatch));
    translateBatch.mockImplementationOnce(async (ids, onProgress) => {
      onProgress({ entityId: ids[0], status: "success" });
      result.current.cancel();
      return { total: 1, succeeded: 1, failed: 0 };
    });

    const items = Array.from({ length: 7 }, (_, i) => item(`e${i}`, ["fr"]));
    await act(() => result.current.run(items));

    expect(translateBatch).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
  });

  it("reports a request failure and ends the run", async () => {
    const translateBatch = vi.fn(async () => {
      throw new Error("Batch translation failed (500)");
    });
    const { result } = renderHook(() => useTranslationSelectionRunner(translateBatch));

    await act(() => result.current.run([item("a", ["fr"])]));

    expect(result.current.lastError).toBe("Batch translation failed (500)");
    expect(result.current.isRunning).toBe(false);
  });
});
