import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: vi.fn() }));

import { createSessionConversation } from "@/lib/services/coachingConversationService";

const COACH = "bbbbbbbb-0000-0000-0000-000000000000";
const STUDENT = "aaaaaaaa-0000-0000-0000-000000000000";

interface FakeOptions {
  existing?: string | null;
  insertError?: { code: string } | null;
  existingAfterRace?: string | null;
}

function createFakeAdmin(options: FakeOptions = {}) {
  const calls = {
    lookups: [] as Array<Record<string, unknown>>,
    inserts: [] as Array<Record<string, unknown>>,
    sessionUpdates: [] as Array<{ values: Record<string, unknown>; id: unknown }>,
  };
  let lookupCount = 0;

  const conversations = () => {
    const filters: Record<string, unknown> = {};
    const lookup = {
      select: () => lookup,
      eq: (column: string, value: unknown) => {
        filters[column] = value;
        return lookup;
      },
      maybeSingle: async () => {
        calls.lookups.push({ ...filters });
        lookupCount += 1;
        const id = lookupCount === 1 ? options.existing : options.existingAfterRace;
        return { data: id ? { id } : null, error: null };
      },
      insert: (values: Record<string, unknown>) => {
        calls.inserts.push(values);
        return {
          select: () => ({
            single: async () =>
              options.insertError
                ? { data: null, error: options.insertError }
                : { data: { id: "conv-new" }, error: null },
          }),
        };
      },
    };
    return lookup;
  };

  const coachingSessions = () => ({
    update: (values: Record<string, unknown>) => ({
      eq: async (_column: string, id: unknown) => {
        calls.sessionUpdates.push({ values, id });
        return { error: null };
      },
    }),
  });

  const admin = {
    from: (table: string) => (table === "conversations" ? conversations() : coachingSessions()),
  } as unknown as SupabaseClient;

  return { admin, calls };
}

describe("createSessionConversation", () => {
  it("reuses the existing conversation, looked up with canonical participant order", async () => {
    const { admin, calls } = createFakeAdmin({ existing: "conv-1" });

    const id = await createSessionConversation(COACH, STUDENT, "session-1", admin);

    expect(id).toBe("conv-1");
    expect(calls.lookups[0]).toEqual({ participant_1: STUDENT, participant_2: COACH });
    expect(calls.inserts).toHaveLength(0);
    expect(calls.sessionUpdates).toEqual([{ values: { conversation_id: "conv-1" }, id: "session-1" }]);
  });

  it("creates the conversation when none exists and links it to the session", async () => {
    const { admin, calls } = createFakeAdmin({ existing: null });

    const id = await createSessionConversation(COACH, STUDENT, "session-1", admin);

    expect(id).toBe("conv-new");
    expect(calls.inserts).toEqual([{ participant_1: STUDENT, participant_2: COACH }]);
    expect(calls.sessionUpdates[0].values).toEqual({ conversation_id: "conv-new" });
  });

  it("reuses the conversation created by a concurrent request on unique violation", async () => {
    const { admin } = createFakeAdmin({
      existing: null,
      insertError: { code: "23505" },
      existingAfterRace: "conv-raced",
    });

    await expect(createSessionConversation(COACH, STUDENT, "session-1", admin)).resolves.toBe(
      "conv-raced"
    );
  });

  it("does nothing when the coach books themselves", async () => {
    const { admin, calls } = createFakeAdmin();

    await expect(createSessionConversation(COACH, COACH, "session-1", admin)).resolves.toBeNull();
    expect(calls.lookups).toHaveLength(0);
    expect(calls.sessionUpdates).toHaveLength(0);
  });
});
