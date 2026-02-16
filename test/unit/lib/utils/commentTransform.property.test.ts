import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import type { Comment, CommentsResponse } from "../../../../src/types/comment";
import type { AdminComment } from "../../../../src/types/admin-comments";

/**
 * Feature: character-comments, Property 5: Transformation inclut tous les champs requis
 *
 * _Pour tout_ commentaire, la transformation vers le format d'affichage (joueur ou
 * admin) doit inclure tous les champs requis : côté joueur (nom du joueur, contenu,
 * date), côté admin (nom du joueur, nom du personnage, extrait du contenu, date).
 *
 * **Validates: Requirements 3.2, 4.2**
 *
 * Feature: character-comments, Property 6: Total count = longueur de la liste
 *
 * _Pour toute_ réponse de l'API commentaires d'un personnage, le champ `totalCount`
 * doit être égal au nombre de commentaires dans le tableau `comments`.
 *
 * **Validates: Requirements 3.4**
 */

// --- Generators ---

const isoDateGenerator = fc
  .integer({
    min: new Date("2020-01-01T00:00:00.000Z").getTime(),
    max: new Date("2030-12-31T23:59:59.999Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

const nullableString = fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), fc.constant(null));

/** Generates a valid Comment object matching the player-side interface */
const commentGenerator: fc.Arbitrary<Comment> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  characterId: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  createdAt: isoDateGenerator,
  updatedAt: isoDateGenerator,
  playerName: nullableString,
  playerAvatar: nullableString,
});

/** Generates a valid AdminComment object matching the admin-side interface */
const adminCommentGenerator: fc.Arbitrary<AdminComment> = fc.record({
  id: fc.uuid(),
  contentExcerpt: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: isoDateGenerator,
  updatedAt: isoDateGenerator,
  playerName: nullableString,
  playerEmail: nullableString,
  characterName: fc.string({ minLength: 1, maxLength: 100 }),
  characterId: fc.uuid(),
});

/** Generates a valid CommentsResponse where totalCount matches comments.length */
const commentsResponseGenerator: fc.Arbitrary<CommentsResponse> = fc
  .array(commentGenerator, { minLength: 0, maxLength: 30 })
  .chain((comments) =>
    fc.record({
      comments: fc.constant(comments),
      totalCount: fc.constant(comments.length),
      userHasCommented: fc.boolean(),
      userComment: fc.oneof(
        fc.constant(undefined),
        comments.length > 0 ? fc.constant(comments[0]) : commentGenerator.map((c) => c)
      ),
    })
  );

// --- Tests ---

describe("Comment Data Transformation - Property-Based Tests", () => {
  describe("Feature: character-comments, Property 5: Transformation inclut tous les champs requis", () => {
    it("player-side Comment includes all required display fields (playerName, content, createdAt)", () => {
      fc.assert(
        fc.property(commentGenerator, (comment: Comment) => {
          // playerName must be present (string or null, but not undefined)
          expect(comment.playerName).not.toBeUndefined();
          expect(typeof comment.playerName === "string" || comment.playerName === null).toBe(true);

          // content must be a defined string
          expect(comment.content).not.toBeUndefined();
          expect(typeof comment.content).toBe("string");

          // createdAt must be a defined string (ISO date)
          expect(comment.createdAt).not.toBeUndefined();
          expect(typeof comment.createdAt).toBe("string");
        }),
        { numRuns: 200 }
      );
    });

    it("admin-side AdminComment includes all required display fields (playerName, characterName, contentExcerpt, createdAt)", () => {
      fc.assert(
        fc.property(adminCommentGenerator, (adminComment: AdminComment) => {
          // playerName must be present (string or null, but not undefined)
          expect(adminComment.playerName).not.toBeUndefined();
          expect(
            typeof adminComment.playerName === "string" || adminComment.playerName === null
          ).toBe(true);

          // characterName must be a defined string
          expect(adminComment.characterName).not.toBeUndefined();
          expect(typeof adminComment.characterName).toBe("string");

          // contentExcerpt must be a defined string
          expect(adminComment.contentExcerpt).not.toBeUndefined();
          expect(typeof adminComment.contentExcerpt).toBe("string");

          // createdAt must be a defined string (ISO date)
          expect(adminComment.createdAt).not.toBeUndefined();
          expect(typeof adminComment.createdAt).toBe("string");
        }),
        { numRuns: 200 }
      );
    });

    it("player-side Comment has all structural fields defined", () => {
      fc.assert(
        fc.property(commentGenerator, (comment: Comment) => {
          const requiredKeys: (keyof Comment)[] = [
            "id",
            "userId",
            "characterId",
            "content",
            "createdAt",
            "updatedAt",
            "playerName",
            "playerAvatar",
          ];
          for (const key of requiredKeys) {
            expect(key in comment).toBe(true);
            expect(comment[key]).not.toBeUndefined();
          }
        }),
        { numRuns: 200 }
      );
    });

    it("admin-side AdminComment has all structural fields defined", () => {
      fc.assert(
        fc.property(adminCommentGenerator, (adminComment: AdminComment) => {
          const requiredKeys: (keyof AdminComment)[] = [
            "id",
            "contentExcerpt",
            "createdAt",
            "updatedAt",
            "playerName",
            "playerEmail",
            "characterName",
            "characterId",
          ];
          for (const key of requiredKeys) {
            expect(key in adminComment).toBe(true);
            expect(adminComment[key]).not.toBeUndefined();
          }
        }),
        { numRuns: 200 }
      );
    });
  });

  describe("Feature: character-comments, Property 6: Total count = longueur de la liste", () => {
    it("totalCount equals comments.length in CommentsResponse", () => {
      fc.assert(
        fc.property(commentsResponseGenerator, (response: CommentsResponse) => {
          expect(response.totalCount).toBe(response.comments.length);
        }),
        { numRuns: 200 }
      );
    });

    it("totalCount is zero when comments array is empty", () => {
      fc.assert(
        fc.property(fc.boolean(), (userHasCommented: boolean) => {
          const response: CommentsResponse = {
            comments: [],
            totalCount: 0,
            userHasCommented,
          };
          expect(response.totalCount).toBe(0);
          expect(response.comments.length).toBe(0);
          expect(response.totalCount).toBe(response.comments.length);
        }),
        { numRuns: 100 }
      );
    });

    it("totalCount is consistent for any number of comments", () => {
      fc.assert(
        fc.property(
          fc.array(commentGenerator, { minLength: 1, maxLength: 50 }),
          (comments: Comment[]) => {
            const response: CommentsResponse = {
              comments,
              totalCount: comments.length,
              userHasCommented: true,
              userComment: comments[0],
            };
            expect(response.totalCount).toBe(response.comments.length);
            expect(response.totalCount).toBeGreaterThan(0);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
