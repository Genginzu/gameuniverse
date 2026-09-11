import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

type ChainResult = { data: unknown; error: unknown };
type Operation =
  | { kind: "select"; table: string; filters: Array<{ op: string; col: string; value: unknown }> }
  | { kind: "update"; table: string; payload: unknown; filters: Array<{ op: string; col: string; value: unknown }> }
  | { kind: "insert"; table: string; payload: unknown };

const operations: Operation[] = [];

function buildChain(table: string, result: ChainResult) {
  const filters: Array<{ op: string; col: string; value: unknown }> = [];

  // Select-like chain (used by .from(t).select(...).in(...).is(...))
  const selectOp: Operation = { kind: "select", table, filters };
  let mode: "select" | "update" | "insert" = "select";

  const proxy: Record<string, unknown> = {};

  for (const m of ["select"]) {
    proxy[m] = (...args: unknown[]) => {
      filters.push({ op: m, col: String(args[0] ?? ""), value: args[1] });
      return proxy;
    };
  }
  proxy.in = (col: string, value: unknown) => {
    filters.push({ op: "in", col, value });
    return proxy;
  };
  proxy.is = (col: string, value: unknown) => {
    filters.push({ op: "is", col, value });
    return proxy;
  };
  proxy.eq = (col: string, value: unknown) => {
    filters.push({ op: "eq", col, value });
    return proxy;
  };
  proxy.update = (payload: unknown) => {
    mode = "update";
    const op: Operation = { kind: "update", table, payload, filters };
    operations.push(op);
    return proxy;
  };
  proxy.insert = (payload: unknown) => {
    mode = "insert";
    operations.push({ kind: "insert", table, payload });
    return Promise.resolve(result);
  };

  proxy.then = (onFulfilled: (v: ChainResult) => unknown) => {
    if (mode === "select") operations.push(selectOp);
    return Promise.resolve(result).then(onFulfilled);
  };

  return proxy;
}

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from: (t: string) => mockFrom(t) }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  operations.length = 0;
});

describe("reconcilePlayerTeamHistory", () => {
  async function load() {
    return import("@/lib/services/esport/playerTeamHistory");
  }

  it("returns zero counts on empty input without hitting the DB", async () => {
    const { reconcilePlayerTeamHistory } = await load();
    const result = await reconcilePlayerTeamHistory([]);
    expect(result).toEqual({ opened: 0, closed: 0, errors: 0 });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("opens a new period when the player has no open membership", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", { data: [], error: null })
    );
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", { data: null, error: null })
    );

    const { reconcilePlayerTeamHistory } = await load();
    const result = await reconcilePlayerTeamHistory([
      { playerLocalId: "p1", newTeamLocalId: "team-A" },
    ]);

    expect(result.opened).toBe(1);
    expect(result.closed).toBe(0);
    const insertOp = operations.find((o) => o.kind === "insert");
    expect(insertOp).toBeDefined();
    expect((insertOp as { payload: unknown }).payload).toMatchObject([
      { player_id: "p1", team_id: "team-A" },
    ]);
  });

  it("closes the open membership when the player becomes a free agent", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", {
        data: [{ id: "membership-1", player_id: "p1", team_id: "team-A" }],
        error: null,
      })
    );
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", { data: null, error: null })
    );

    const { reconcilePlayerTeamHistory } = await load();
    const result = await reconcilePlayerTeamHistory([
      { playerLocalId: "p1", newTeamLocalId: null },
    ]);

    expect(result.closed).toBe(1);
    expect(result.opened).toBe(0);
    const updateOp = operations.find((o) => o.kind === "update");
    expect(updateOp).toBeDefined();
    expect((updateOp as { payload: { ended_at: string } }).payload.ended_at).toBeDefined();
  });

  it("closes and reopens when the player switches teams", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", {
        data: [{ id: "m1", player_id: "p1", team_id: "team-A" }],
        error: null,
      })
    );
    // Update old, insert new — both succeed.
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", { data: null, error: null })
    );
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", { data: null, error: null })
    );

    const { reconcilePlayerTeamHistory } = await load();
    const result = await reconcilePlayerTeamHistory([
      { playerLocalId: "p1", newTeamLocalId: "team-B" },
    ]);

    expect(result.closed).toBe(1);
    expect(result.opened).toBe(1);
  });

  it("does nothing when the player is already on the new team", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", {
        data: [{ id: "m1", player_id: "p1", team_id: "team-A" }],
        error: null,
      })
    );

    const { reconcilePlayerTeamHistory } = await load();
    const result = await reconcilePlayerTeamHistory([
      { playerLocalId: "p1", newTeamLocalId: "team-A" },
    ]);

    expect(result).toEqual({ opened: 0, closed: 0, errors: 0 });
    // No update or insert ops should have been issued.
    expect(operations.find((o) => o.kind === "update")).toBeUndefined();
    expect(operations.find((o) => o.kind === "insert")).toBeUndefined();
  });

  it("returns errors when the initial read fails", async () => {
    mockFrom.mockReturnValueOnce(
      buildChain("esport_player_team_history", { data: null, error: new Error("nope") })
    );

    const { reconcilePlayerTeamHistory } = await load();
    const result = await reconcilePlayerTeamHistory([
      { playerLocalId: "p1", newTeamLocalId: "team-A" },
    ]);

    expect(result.errors).toBe(1);
  });
});
