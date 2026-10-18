/**
 * Feature: igdb-game-versions
 * Property 1: version extraction (title fallback, description, cover URL)
 * Property 3: association to the parent game and IGDB ordering
 * Property 4: idempotent writes rely on the (game_id, igdb_id) upsert key
 *
 * Runs against the shared mapper and the real writers that use it.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { toGameVersionRows } from "../gameVersionRows";
import { IGDBService } from "@/lib/services/igdbService";
import type { IGDBGameVersion } from "@/types/igdb";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const db = createSupabaseQueryMock();
vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: async () => db.client }));

const { createVersions } = await import("@/lib/services/game-import/extras");
const { syncVersions } = await import("@/lib/services/igdb-sync-fields-extended");

const versionArb: fc.Arbitrary<IGDBGameVersion> = fc.record({
  id: fc.integer({ min: 1, max: 999_999 }),
  name: fc.string({ minLength: 1, maxLength: 60 }),
  slug: fc.stringMatching(/^[a-z0-9-]{3,30}$/),
  version_title: fc.option(fc.string({ maxLength: 60 }), { nil: null }),
  summary: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  cover: fc.option(fc.record({ image_id: fc.stringMatching(/^[a-zA-Z0-9]{5,20}$/) }), {
    nil: undefined,
  }),
});
const versionsArb = fc.uniqueArray(versionArb, { selector: (v) => v.id, maxLength: 15 });

describe("toGameVersionRows", () => {
  it("Property 1: maps title, description and cover for every version", () => {
    fc.assert(
      fc.property(fc.uuid(), versionsArb, (gameId, versions) => {
        const rows = toGameVersionRows(gameId, versions);
        rows.forEach((row, i) => {
          const v = versions[i];
          expect(row.igdb_id).toBe(v.id);
          expect(row.version_title).toBe(v.version_title || v.name);
          expect(row.description).toBe(v.summary || null);
          expect(row.cover_image_url).toBe(
            v.cover?.image_id ? IGDBService.buildImageUrl(v.cover.image_id, "cover_big") : null
          );
        });
      })
    );
  });

  it("Property 3: links every row to the parent game in IGDB order", () => {
    fc.assert(
      fc.property(fc.uuid(), versionsArb, (gameId, versions) => {
        const rows = toGameVersionRows(gameId, versions);
        expect(rows).toHaveLength(versions.length);
        expect(rows.every((r) => r.game_id === gameId)).toBe(true);
        expect(rows.map((r) => r.display_order)).toEqual(versions.map((_, i) => i));
        expect(rows.map((r) => r.igdb_id)).toEqual(versions.map((v) => v.id));
      })
    );
  });

  it("is deterministic, so re-importing produces identical rows", () => {
    fc.assert(
      fc.property(fc.uuid(), versionsArb, (gameId, versions) => {
        expect(toGameVersionRows(gameId, versions)).toEqual(toGameVersionRows(gameId, versions));
      })
    );
  });
});

describe("version writers", () => {
  beforeEach(() => {
    db.reset();
    vi.restoreAllMocks();
  });

  it("createVersions inserts the mapped rows in one batch", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        versionsArb.filter((v) => v.length > 0),
        async (gameId, versions) => {
          db.reset();
          vi.spyOn(IGDBService, "getGameVersions").mockResolvedValue(versions);

          await createVersions(gameId, 42);

          expect(db.callsFor("game_versions", "insert")).toEqual([
            [toGameVersionRows(gameId, versions)],
          ]);
        }
      ),
      { numRuns: 25 }
    );
  });

  it("createVersions writes nothing when IGDB has no versions", async () => {
    vi.spyOn(IGDBService, "getGameVersions").mockResolvedValue([]);
    await createVersions("game-1", 42);
    expect(db.calls).toHaveLength(0);
  });

  it("syncVersions replaces existing versions with the mapped rows", async () => {
    const versions: IGDBGameVersion[] = [
      { id: 1, name: "Base", slug: "base", version_title: null },
      {
        id: 2,
        name: "Deluxe",
        slug: "deluxe",
        version_title: "Deluxe Edition",
        cover: { image_id: "abc12" },
      },
    ];
    vi.spyOn(IGDBService, "getGameVersions").mockResolvedValue(versions);

    await syncVersions(db.client as never, "game-1", 42);

    const ops = db.calls.filter((c) => c.table === "game_versions").map((c) => c.method);
    expect(ops.indexOf("delete")).toBeLessThan(ops.indexOf("insert"));
    expect(db.callsFor("game_versions", "insert").map(([row]) => row)).toEqual(
      toGameVersionRows("game-1", versions)
    );
  });
});
