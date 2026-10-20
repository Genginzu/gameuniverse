import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyncJobCard } from "@/components/admin/esport/SyncJobCard";
import type { SyncJob } from "@/types/esport-sync";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

function job(overrides: Partial<SyncJob> = {}): SyncJob {
  return {
    id: "job-1",
    kind: "full",
    entity: null,
    game: null,
    status: "running",
    cursor: { teams: { page: 151, done: true }, tournaments_upcoming: { page: 3, done: false } },
    total_synced: 1234,
    total_errors: 0,
    error_message: null,
    started_at: null,
    completed_at: null,
    last_chunk_at: null,
    created_at: "2026-10-18T10:00:00.000Z",
    ...overrides,
  };
}

describe("SyncJobCard", () => {
  it("renders one row per logical entity for a full job", () => {
    render(<SyncJobCard job={job()} />);

    expect(screen.getByText("titleFull")).toBeInTheDocument();
    for (const key of ["teams", "tournaments", "players", "matches"]) {
      expect(screen.getByText(`entities.${key}`)).toBeInTheDocument();
    }
    expect(screen.getAllByText("done")).toHaveLength(1);
  });

  it("only renders the selected entity for an entity job and surfaces failures", () => {
    render(<SyncJobCard job={job({ kind: "entity", entity: "players", status: "failed", error_message: "Rate limit" })} />);

    expect(screen.getByText("entities.players")).toBeInTheDocument();
    expect(screen.queryByText("entities.teams")).not.toBeInTheDocument();
    expect(screen.getByText("Rate limit")).toBeInTheDocument();
  });
});
