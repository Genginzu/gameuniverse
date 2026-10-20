import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const db = vi.hoisted(() => ({ mock: null as ReturnType<typeof createSupabaseQueryMock> | null }));

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db.mock!.client }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import {
  discussionMessageSent,
  followersNotifiedOfPost,
  postCommented,
  postMentioned,
} from "@/lib/services/notifications";

const CREATED = { data: { id: "n1" } };
const POST = { postId: "post-1", authorId: "author", content: "Hello world" };

function inserted() {
  return db.mock!.callsFor("notifications", "insert").map(([row]) => row);
}

beforeEach(() => {
  db.mock = createSupabaseQueryMock();
  db.mock.enqueue("notifications", CREATED, CREATED, CREATED, CREATED);
});

describe("post notification intents", () => {
  it("postMentioned notifies each mentioned player except the author", async () => {
    const result = await postMentioned({ ...POST, mentionedPlayerIds: ["m1", "author", "m2"] });
    expect(result).toEqual({ delivered: 2 });
    expect(inserted()).toEqual([
      {
        recipient_id: "m1",
        sender_id: "author",
        type: "post_mention",
        reference_id: "post-1",
        content_preview: "Hello world",
      },
      {
        recipient_id: "m2",
        sender_id: "author",
        type: "post_mention",
        reference_id: "post-1",
        content_preview: "Hello world",
      },
    ]);
  });

  it("followersNotifiedOfPost fans out to deduplicated subscribers and friends", async () => {
    db.mock!.enqueue("player_subscriptions", {
      data: [{ subscriber_id: "s1" }, { subscriber_id: "f1" }],
    });
    db.mock!.enqueue(
      "friendships",
      { data: [{ receiver_id: "f1" }] },
      { data: [{ sender_id: "f2" }, { sender_id: "author" }] }
    );

    const result = await followersNotifiedOfPost(POST);

    expect(result).toEqual({ delivered: 3 });
    expect(inserted().map((row) => (row as { recipient_id: string }).recipient_id)).toEqual([
      "s1",
      "f1",
      "f2",
    ]);
    expect(inserted()[0]).toMatchObject({ type: "post_created", reference_id: "post-1" });
  });

  it("followersNotifiedOfPost delivers nothing without followers", async () => {
    expect(await followersNotifiedOfPost(POST)).toEqual({ delivered: 0 });
    expect(inserted()).toEqual([]);
  });

  it("postCommented notifies the post owner with the commented post as reference", async () => {
    db.mock!.enqueue("player_posts", { data: { player_id: "owner" } });
    const result = await postCommented({
      postId: "post-1",
      commenterId: "commenter",
      content: "Nice",
    });
    expect(result).toEqual({ delivered: 1 });
    expect(inserted()[0]).toEqual({
      recipient_id: "owner",
      sender_id: "commenter",
      type: "post_comment",
      reference_id: "post-1",
      content_preview: "Nice",
    });
  });

  it("postCommented skips owners commenting their own post and missing posts", async () => {
    db.mock!.enqueue("player_posts", { data: { player_id: "owner" } }, { data: null });
    await postCommented({ postId: "post-1", commenterId: "owner", content: "Me" });
    await postCommented({ postId: "missing", commenterId: "x", content: "?" });
    expect(inserted()).toEqual([]);
  });

  it("discussionMessageSent notifies the other participant", async () => {
    db.mock!.enqueue("conversations", { data: { participant_1: "me", participant_2: "you" } });
    await discussionMessageSent({ conversationId: "c1", senderId: "me", content: "Hey" });
    expect(inserted()[0]).toEqual({
      recipient_id: "you",
      sender_id: "me",
      type: "discussion_message",
      reference_id: "c1",
      content_preview: "Hey",
    });
  });

  it("never throws when a lookup fails", async () => {
    db.mock!.client.from = () => {
      throw new Error("db down");
    };
    await expect(
      discussionMessageSent({ conversationId: "c1", senderId: "me", content: "Hey" })
    ).resolves.toEqual({ delivered: 0 });
  });
});
