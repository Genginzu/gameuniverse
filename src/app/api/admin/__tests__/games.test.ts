/**
 * Basic integration tests for admin games API
 * These tests verify the API routes are properly structured and handle validation
 */

import { describe, test, expect, beforeEach } from "bun:test";
import {
  createGameSchema,
  updateGameSchema,
  bulkGameOperationSchema,
} from "@/lib/validations/game";

describe("Admin Games API Validation", () => {
  describe("createGameSchema", () => {
    test("validates valid game creation data", () => {
      const validData = {
        game: {
          slug: "test-game",
          cover_image_url: "https://example.com/cover.jpg",
          release_date: "2024-01-01",
          metascore: 85,
        },
        translations: [
          {
            language_code: "fr",
            title: "Test Game",
            description: "A test game description",
          },
        ],
        companies: [
          {
            company_id: "550e8400-e29b-41d4-a716-446655440001",
            role: "developer" as const,
            is_primary: true,
          },
        ],
        genres: [
          {
            genre_id: "550e8400-e29b-41d4-a716-446655440002",
          },
        ],
      };

      const result = createGameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("rejects invalid slug format", () => {
      const invalidData = {
        game: {
          slug: "Test Game!", // Invalid characters
        },
        translations: [
          {
            language_code: "fr",
            title: "Test Game",
          },
        ],
        companies: [
          {
            company_id: "550e8400-e29b-41d4-a716-446655440001",
            role: "developer" as const,
          },
        ],
        genres: [
          {
            genre_id: "550e8400-e29b-41d4-a716-446655440002",
          },
        ],
      };

      const result = createGameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes("slug"))).toBe(true);
      }
    });

    test("requires at least one translation", () => {
      const invalidData = {
        game: {
          slug: "test-game",
        },
        translations: [], // Empty array
        companies: [
          {
            company_id: "550e8400-e29b-41d4-a716-446655440001",
            role: "developer" as const,
          },
        ],
        genres: [
          {
            genre_id: "550e8400-e29b-41d4-a716-446655440002",
          },
        ],
      };

      const result = createGameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes("translations"))).toBe(true);
      }
    });
  });

  describe("updateGameSchema", () => {
    test("validates partial game update data", () => {
      const validData = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        game: {
          metascore: 90,
        },
        translations: [
          {
            language_code: "en",
            title: "Updated Title",
          },
        ],
      };

      const result = updateGameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("requires valid UUID for game ID", () => {
      const invalidData = {
        id: "invalid-uuid",
        game: {
          metascore: 90,
        },
      };

      const result = updateGameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes("id"))).toBe(true);
      }
    });
  });

  describe("bulkGameOperationSchema", () => {
    test("validates bulk delete operation", () => {
      const validData = {
        operation: "delete" as const,
        game_ids: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
      };

      const result = bulkGameOperationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("validates bulk update operation with data", () => {
      const validData = {
        operation: "update" as const,
        game_ids: ["550e8400-e29b-41d4-a716-446655440001"],
        data: {
          metascore: 95,
        },
      };

      const result = bulkGameOperationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("rejects invalid operation type", () => {
      const invalidData = {
        operation: "invalid" as any,
        game_ids: ["550e8400-e29b-41d4-a716-446655440001"],
      };

      const result = bulkGameOperationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes("operation"))).toBe(true);
      }
    });

    test("requires at least one game ID", () => {
      const invalidData = {
        operation: "delete" as const,
        game_ids: [], // Empty array
      };

      const result = bulkGameOperationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e) => e.path.includes("game_ids"))).toBe(true);
      }
    });
  });
});
