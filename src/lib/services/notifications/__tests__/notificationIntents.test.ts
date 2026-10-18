import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const db = vi.hoisted(() => ({ mock: null as ReturnType<typeof createSupabaseQueryMock> | null }));

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db.mock!.client }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import {
  achievementUnlocked,
  coachingSessionPaid,
  coachingSessionRequested,
  coachingSessionTransitioned,
  contentAuthorWarned,
  friendAccepted,
  friendRequested,
  reviewVoted,
} from "@/lib/services/notifications";

const CREATED = { data: { id: "n1" } };

function inserted() {
  return db.mock!.callsFor("notifications", "insert").map(([row]) => row);
}

beforeEach(() => {
  db.mock = createSupabaseQueryMock();
  db.mock.enqueue("notifications", CREATED, CREATED, CREATED);
});

describe("social notification intents", () => {
  it("friendRequested notifies the receiver about the friendship", async () => {
    const result = await friendRequested({ friendshipId: "f1", requesterId: "a", receiverId: "b" });
    expect(result).toEqual({ delivered: 1 });
    expect(inserted()).toEqual([
      {
        recipient_id: "b",
        sender_id: "a",
        type: "friend_request",
        reference_id: "f1",
        content_preview: "",
      },
    ]);
  });

  it("friendAccepted notifies the requester and skips self-acceptance", async () => {
    await friendAccepted({ friendshipId: "f1", accepterId: "b", requesterId: "a" });
    expect(await friendAccepted({ friendshipId: "f1", accepterId: "a", requesterId: "a" })).toEqual(
      {
        delivered: 0,
      }
    );
    expect(inserted()).toEqual([
      {
        recipient_id: "a",
        sender_id: "b",
        type: "friend_accepted",
        reference_id: "f1",
        content_preview: "",
      },
    ]);
  });

  it("reviewVoted stores the vote type as the preview payload", async () => {
    await reviewVoted({ reviewId: "r1", voterId: "v", authorId: "w", voteType: "not_helpful" });
    expect(inserted()[0]).toMatchObject({
      recipient_id: "w",
      type: "review_vote",
      reference_id: "r1",
      content_preview: "not_helpful",
    });
  });

  it("achievementUnlocked emits a system notification to the player", async () => {
    await achievementUnlocked({ userId: "u1", achievementKey: "library_5" });
    expect(inserted()[0]).toEqual({
      recipient_id: "u1",
      sender_id: "u1",
      type: "achievement_unlocked",
      reference_id: "u1",
      content_preview: "library_5",
    });
  });

  it("contentAuthorWarned keeps the warned content type alongside its id", async () => {
    await contentAuthorWarned({
      authorId: "au",
      moderatorId: "ad",
      contentType: "review",
      contentId: "c1",
    });
    expect(inserted()[0]).toEqual({
      recipient_id: "au",
      sender_id: "ad",
      type: "moderation_warning",
      reference_id: "c1",
      content_preview: "review",
    });
  });
});

describe("coaching notification intents", () => {
  it("coachingSessionRequested resolves the coach player before notifying", async () => {
    db.mock!.enqueue("coach_profiles", { data: { player_id: "coach-player" } });
    const result = await coachingSessionRequested({
      sessionId: "s1",
      studentId: "student",
      coachProfileId: "coach-profile",
    });
    expect(result).toEqual({ delivered: 1 });
    expect(db.mock!.callsFor("coach_profiles", "eq")).toEqual([["id", "coach-profile"]]);
    expect(inserted()[0]).toMatchObject({
      recipient_id: "coach-player",
      sender_id: "student",
      type: "coaching_requested",
      reference_id: "s1",
      content_preview: "",
    });
  });

  it("coachingSessionRequested delivers nothing when the coach is unknown", async () => {
    db.mock!.enqueue("coach_profiles", { data: null });
    const result = await coachingSessionRequested({
      sessionId: "s1",
      studentId: "student",
      coachProfileId: "missing",
    });
    expect(result).toEqual({ delivered: 0 });
    expect(inserted()).toEqual([]);
  });

  it("coachingSessionTransitioned notifies the given recipient with the transition kind", async () => {
    await coachingSessionTransitioned({
      sessionId: "s1",
      actorId: "coach",
      recipientId: "student",
      type: "coaching_confirmed",
    });
    expect(
      await coachingSessionTransitioned({
        sessionId: "s1",
        actorId: "student",
        recipientId: null,
        type: "coaching_cancelled",
      })
    ).toEqual({ delivered: 0 });
    expect(inserted()).toEqual([
      expect.objectContaining({ recipient_id: "student", type: "coaching_confirmed" }),
    ]);
  });

  it("coachingSessionPaid resolves the coach through the session", async () => {
    db.mock!.enqueue("coaching_sessions", { data: { coach_id: "coach-profile" } });
    db.mock!.enqueue("coach_profiles", { data: { player_id: "coach-player" } });
    await coachingSessionPaid({ sessionId: "s1", studentId: "student" });
    expect(inserted()[0]).toMatchObject({
      recipient_id: "coach-player",
      sender_id: "student",
      type: "coaching_paid",
      reference_id: "s1",
    });
  });
});
