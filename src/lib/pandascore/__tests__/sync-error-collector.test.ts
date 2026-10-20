import { describe, it, expect } from "vitest";
import {
  MAX_ERROR_DETAILS,
  SyncErrorCollector,
  type SyncErrorDetail,
} from "../../../../supabase/functions/_shared/pandascore/sync-error-collector.ts";

function detail(id: number): SyncErrorDetail {
  return { type: "team", id, phase: "upsert", error: `boom ${id}` };
}

function fill(collector: SyncErrorCollector, count: number, offset = 0) {
  for (let i = 0; i < count; i++) collector.add(detail(offset + i));
}

describe("SyncErrorCollector ledger", () => {
  it("serialises entries without a summary below the cap", () => {
    const collector = new SyncErrorCollector();
    fill(collector, 3);

    expect(collector.toJSON()).toEqual([detail(0), detail(1), detail(2)]);
    expect(collector.count).toBe(3);
  });

  it("appends a typed summary carrying the dropped count once capped", () => {
    const collector = new SyncErrorCollector();
    fill(collector, MAX_ERROR_DETAILS + 7);

    const stored = collector.toJSON();

    expect(stored).toHaveLength(MAX_ERROR_DETAILS + 1);
    expect(stored.at(-1)).toMatchObject({ type: "summary", id: null, dropped: 7 });
    expect(collector.count).toBe(MAX_ERROR_DETAILS + 7);
  });

  it("rehydrates entries and the dropped count losslessly", () => {
    const original = new SyncErrorCollector();
    fill(original, MAX_ERROR_DETAILS + 4);

    const restored = SyncErrorCollector.fromJSON(JSON.parse(JSON.stringify(original.toJSON())));

    expect(restored.count).toBe(original.count);
    expect(restored.droppedCount).toBe(4);
    expect(restored.toJSON()).toEqual(original.toJSON());
  });

  it("keeps counting drops after rehydration instead of storing the summary as an entry", () => {
    const original = new SyncErrorCollector();
    fill(original, MAX_ERROR_DETAILS + 2);
    const restored = SyncErrorCollector.fromJSON(original.toJSON());

    fill(restored, 3, 1000);

    const stored = restored.toJSON();
    expect(stored.filter((entry) => entry.type === "summary")).toHaveLength(1);
    expect(stored.at(-1)).toMatchObject({ type: "summary", dropped: 5 });
    expect(restored.count).toBe(MAX_ERROR_DETAILS + 5);
  });

  it("parses the dropped count from a legacy summary without the typed field", () => {
    const legacy = [
      detail(1),
      { type: "summary", id: null, phase: "fetch", error: "12 additional errors omitted (cap: 50)" },
    ];

    const restored = SyncErrorCollector.fromJSON(legacy);

    expect(restored.count).toBe(13);
    expect(restored.droppedCount).toBe(12);
  });

  it("ignores malformed stored values", () => {
    expect(SyncErrorCollector.fromJSON(null).count).toBe(0);
    expect(SyncErrorCollector.fromJSON([42, { type: "team" }]).count).toBe(0);
  });
});
