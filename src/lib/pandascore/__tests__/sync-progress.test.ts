import { describe, it, expect } from "vitest";
import { buildSyncProgressView } from "@/lib/pandascore/sync-progress";
import type { SyncJob } from "@/types/esport-sync";

function job(overrides: Partial<SyncJob> = {}): Pick<SyncJob, "kind" | "entity" | "status" | "cursor"> {
  return { kind: "full", entity: null, status: "running", cursor: {}, ...overrides };
}

describe("buildSyncProgressView", () => {
  it("groups the six cursor keys into four logical entities", () => {
    const view = buildSyncProgressView(job());

    expect(view.entities.map((entity) => entity.key)).toEqual(["teams", "tournaments", "players", "matches"]);
    expect(view.entities.find((entity) => entity.key === "matches")?.bars.map((bar) => bar.variant)).toEqual([
      "past",
      "running",
    ]);
    expect(view.currentKey).toBe("teams");
  });

  it("derives percentages and the current bar from the cursor", () => {
    const view = buildSyncProgressView(
      job({ cursor: { teams: { page: 151, done: true }, tournaments_upcoming: { page: 6, done: false } } }),
    );
    const [teams, tournaments] = view.entities;

    expect(teams).toMatchObject({ done: true, isCurrent: false });
    expect(teams.bars[0]).toMatchObject({ percent: 100, done: true });
    expect(tournaments.isCurrent).toBe(true);
    expect(tournaments.bars[0]).toMatchObject({ key: "tournaments_upcoming", page: 6, percent: 50, isCurrent: true });
  });

  it("caps an unfinished bar at 99 percent", () => {
    const view = buildSyncProgressView(job({ cursor: { teams: { page: 400, done: false } } }));

    expect(view.entities[0].bars[0].percent).toBe(99);
  });

  it("restricts the view to the selected entity for an entity job", () => {
    const view = buildSyncProgressView(job({ kind: "entity", entity: "players" }));

    expect(view.entities.map((entity) => entity.key)).toEqual(["players"]);
    expect(view.currentKey).toBe("players");
  });

  it("has no current bar once the job is no longer active", () => {
    const view = buildSyncProgressView(job({ status: "failed" }));

    expect(view.currentKey).toBeNull();
    expect(view.entities.every((entity) => !entity.isCurrent)).toBe(true);
  });
});
