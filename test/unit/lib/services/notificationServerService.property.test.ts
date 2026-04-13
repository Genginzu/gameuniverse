import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: notifications-system, Property 4: Création de notification sur commentaire de post
 *
 * _Pour tout_ commentaire créé sur le post d'un autre joueur, une notification de
 * type `post_comment` doit être créée avec le `recipient_id` égal au propriétaire
 * du post, le `sender_id` égal à l'auteur du commentaire, et un `content_preview`
 * tronqué à 100 caractères maximum. Si l'auteur du commentaire est le propriétaire
 * du post, aucune notification ne doit être créée.
 *
 * **Validates: Requirements 3.1, 3.3, 3.4**
 */

// --- Mock setup ---

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn().mockResolvedValue({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// --- Generators ---

/** UUID generator for player IDs */
const uuidGen = fc.uuid();

/** Short content: 1-100 chars (no truncation needed) */
const shortContentGen = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.length >= 1);

/** Long content: 101-300 chars (needs truncation) */
const longContentGen = fc.string({ minLength: 101, maxLength: 300 }).filter((s) => s.length > 100);

/** Any content: 1-300 chars */
const anyContentGen = fc.string({ minLength: 1, maxLength: 300 }).filter((s) => s.length >= 1);

// --- Tests ---

describe("NotificationServerService - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock chain: insert -> select -> single
    mockSingle.mockResolvedValue({
      data: {
        id: "00000000-0000-0000-0000-000000000001",
        recipient_id: "r",
        sender_id: "s",
        type: "post_comment",
        reference_id: "ref",
        content_preview: "",
        is_read: false,
        created_at: new Date().toISOString(),
      },
      error: null,
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
  });

  describe("Feature: notifications-system, Property 5: Création de notification sur message de discussion", () => {
    /**
     * Feature: notifications-system, Property 5: Création de notification sur message de discussion
     *
     * _Pour tout_ message envoyé dans une conversation, une notification de type
     * `discussion_message` doit être créée avec le `recipient_id` égal à l'autre
     * participant de la conversation, et un `content_preview` tronqué à 100
     * caractères maximum.
     *
     * **Validates: Requirements 3.2, 3.4**
     */

    it("notification is created with type discussion_message and correct fields", async () => {
      const { NotificationServerService } =
        await import("@/lib/services/notificationServerService");

      await fc.assert(
        fc.asyncProperty(
          uuidGen,
          uuidGen,
          uuidGen,
          anyContentGen,
          async (recipientId, senderId, referenceId, content) => {
            // Ensure different IDs to avoid self-notification block
            if (recipientId === senderId) return;

            vi.clearAllMocks();
            const truncated = content.slice(0, 100);

            mockSingle.mockResolvedValue({
              data: {
                id: "00000000-0000-0000-0000-000000000001",
                recipient_id: recipientId,
                sender_id: senderId,
                type: "discussion_message",
                reference_id: referenceId,
                content_preview: truncated,
                is_read: false,
                created_at: new Date().toISOString(),
              },
              error: null,
            });
            mockSelect.mockReturnValue({ single: mockSingle });
            mockInsert.mockReturnValue({ select: mockSelect });

            const result = await NotificationServerService.create(
              recipientId,
              senderId,
              "discussion_message",
              referenceId,
              content
            );

            // Verify insert was called with correct fields
            expect(mockInsert).toHaveBeenCalledTimes(1);
            const insertedData = mockInsert.mock.calls[0][0];
            expect(insertedData.recipient_id).toBe(recipientId);
            expect(insertedData.sender_id).toBe(senderId);
            expect(insertedData.type).toBe("discussion_message");
            expect(insertedData.reference_id).toBe(referenceId);
            expect(insertedData.content_preview).toBe(truncated);
            expect(insertedData.content_preview.length).toBeLessThanOrEqual(100);

            // Verify returned notification has correct shape
            expect(result).not.toBeNull();
            expect(result!.recipientId).toBe(recipientId);
            expect(result!.senderId).toBe(senderId);
            expect(result!.type).toBe("discussion_message");
            expect(result!.referenceId).toBe(referenceId);
            expect(result!.contentPreview).toBe(truncated);
            expect(result!.isRead).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("content_preview is truncated to 100 chars for discussion messages", async () => {
      const { NotificationServerService } =
        await import("@/lib/services/notificationServerService");

      await fc.assert(
        fc.asyncProperty(
          uuidGen,
          uuidGen,
          uuidGen,
          longContentGen,
          async (recipientId, senderId, referenceId, content) => {
            // Ensure different IDs to avoid self-notification block
            if (recipientId === senderId) return;

            vi.clearAllMocks();
            const truncated = content.slice(0, 100);

            mockSingle.mockResolvedValue({
              data: {
                id: "00000000-0000-0000-0000-000000000001",
                recipient_id: recipientId,
                sender_id: senderId,
                type: "discussion_message",
                reference_id: referenceId,
                content_preview: truncated,
                is_read: false,
                created_at: new Date().toISOString(),
              },
              error: null,
            });
            mockSelect.mockReturnValue({ single: mockSingle });
            mockInsert.mockReturnValue({ select: mockSelect });

            await NotificationServerService.create(
              recipientId,
              senderId,
              "discussion_message",
              referenceId,
              content
            );

            expect(mockInsert).toHaveBeenCalledTimes(1);
            const insertedData = mockInsert.mock.calls[0][0];
            expect(insertedData.content_preview).toBe(truncated);
            expect(insertedData.content_preview.length).toBeLessThanOrEqual(100);
            expect(insertedData.content_preview.length).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Feature: notifications-system, Property 4: Création de notification sur commentaire de post", () => {
    it("self-notification is blocked: returns null and does not insert when recipientId === senderId", async () => {
      const { NotificationServerService } =
        await import("@/lib/services/notificationServerService");

      await fc.assert(
        fc.asyncProperty(
          uuidGen,
          uuidGen,
          anyContentGen,
          async (playerId, referenceId, content) => {
            vi.clearAllMocks();
            mockSingle.mockResolvedValue({
              data: {
                id: "00000000-0000-0000-0000-000000000001",
                recipient_id: playerId,
                sender_id: playerId,
                type: "post_comment",
                reference_id: referenceId,
                content_preview: content.slice(0, 100),
                is_read: false,
                created_at: new Date().toISOString(),
              },
              error: null,
            });
            mockSelect.mockReturnValue({ single: mockSingle });
            mockInsert.mockReturnValue({ select: mockSelect });

            const result = await NotificationServerService.create(
              playerId,
              playerId,
              "post_comment",
              referenceId,
              content
            );

            expect(result).toBeNull();
            expect(mockInsert).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("content_preview is truncated to 100 chars when content exceeds 100 chars", async () => {
      const { NotificationServerService } =
        await import("@/lib/services/notificationServerService");

      await fc.assert(
        fc.asyncProperty(
          uuidGen,
          uuidGen,
          uuidGen,
          longContentGen,
          async (recipientId, senderId, referenceId, content) => {
            // Ensure different IDs to avoid self-notification block
            if (recipientId === senderId) return;

            vi.clearAllMocks();
            const truncated = content.slice(0, 100);

            mockSingle.mockResolvedValue({
              data: {
                id: "00000000-0000-0000-0000-000000000001",
                recipient_id: recipientId,
                sender_id: senderId,
                type: "post_comment",
                reference_id: referenceId,
                content_preview: truncated,
                is_read: false,
                created_at: new Date().toISOString(),
              },
              error: null,
            });
            mockSelect.mockReturnValue({ single: mockSingle });
            mockInsert.mockReturnValue({ select: mockSelect });

            await NotificationServerService.create(
              recipientId,
              senderId,
              "post_comment",
              referenceId,
              content
            );

            expect(mockInsert).toHaveBeenCalledTimes(1);
            const insertedData = mockInsert.mock.calls[0][0];
            expect(insertedData.content_preview).toBe(truncated);
            expect(insertedData.content_preview.length).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("notification is created with correct type and fields for post_comment", async () => {
      const { NotificationServerService } =
        await import("@/lib/services/notificationServerService");

      await fc.assert(
        fc.asyncProperty(
          uuidGen,
          uuidGen,
          uuidGen,
          anyContentGen,
          async (recipientId, senderId, referenceId, content) => {
            // Ensure different IDs to avoid self-notification block
            if (recipientId === senderId) return;

            vi.clearAllMocks();
            const truncated = content.slice(0, 100);

            mockSingle.mockResolvedValue({
              data: {
                id: "00000000-0000-0000-0000-000000000001",
                recipient_id: recipientId,
                sender_id: senderId,
                type: "post_comment",
                reference_id: referenceId,
                content_preview: truncated,
                is_read: false,
                created_at: new Date().toISOString(),
              },
              error: null,
            });
            mockSelect.mockReturnValue({ single: mockSingle });
            mockInsert.mockReturnValue({ select: mockSelect });

            const result = await NotificationServerService.create(
              recipientId,
              senderId,
              "post_comment",
              referenceId,
              content
            );

            // Verify insert was called with correct fields
            expect(mockInsert).toHaveBeenCalledTimes(1);
            const insertedData = mockInsert.mock.calls[0][0];
            expect(insertedData.recipient_id).toBe(recipientId);
            expect(insertedData.sender_id).toBe(senderId);
            expect(insertedData.type).toBe("post_comment");
            expect(insertedData.reference_id).toBe(referenceId);
            expect(insertedData.content_preview).toBe(truncated);
            expect(insertedData.content_preview.length).toBeLessThanOrEqual(100);

            // Verify returned notification has correct shape
            expect(result).not.toBeNull();
            expect(result!.recipientId).toBe(recipientId);
            expect(result!.senderId).toBe(senderId);
            expect(result!.type).toBe("post_comment");
            expect(result!.referenceId).toBe(referenceId);
            expect(result!.contentPreview).toBe(truncated);
            expect(result!.isRead).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
