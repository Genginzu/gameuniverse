import { describe, it, expect, vi } from "vitest";
import { untypedTable } from "@/lib/utils/untypedTable";

describe("untypedTable", () => {
  const mockResult = { select: vi.fn() };
  const mockSupabase = { from: vi.fn(() => mockResult) } as never;

  it("calls supabase.from with the table name", () => {
    untypedTable(mockSupabase, "my_table");
    expect(mockSupabase.from).toHaveBeenCalledWith("my_table");
  });

  it("returns the result of supabase.from", () => {
    const result = untypedTable(mockSupabase, "my_table");
    expect(result).toBe(mockResult);
  });
});
