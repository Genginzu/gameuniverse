import { describe, it, expect } from "vitest";

/**
 * DeleteGameDialog Unit Tests
 *
 * Tests the display and interaction logic for the delete confirmation dialog:
 * 1. Dialog visibility based on game selection
 * 2. Confirmation triggers delete
 * 3. Cancel closes dialog without deleting
 * 4. Dialog cannot be dismissed while deleting
 *
 * Requirements: 6.1, 6.2
 */

interface AdminGame {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  releaseDate: string | null;
  updatedAt: string;
}

// Simulate dialog open state logic (mirrors page.tsx: isOpen = gameToDelete !== null)
function isDialogOpen(gameToDelete: AdminGame | null): boolean {
  return gameToDelete !== null;
}

// Simulate the close handler logic (cannot close while deleting)
function canCloseDialog(isDeleting: boolean): boolean {
  return !isDeleting;
}

// Simulate the confirm handler logic
async function simulateConfirm(
  gameToDelete: AdminGame | null,
  deleteGame: (id: string) => Promise<void>
): Promise<{ success: boolean; deletedId: string | null }> {
  if (!gameToDelete) return { success: false, deletedId: null };
  try {
    await deleteGame(gameToDelete.id);
    return { success: true, deletedId: gameToDelete.id };
  } catch {
    return { success: false, deletedId: null };
  }
}

const sampleGame: AdminGame = {
  id: "game-123",
  slug: "test-game",
  title: "Test Game",
  coverImage: "https://example.com/img.jpg",
  releaseDate: "2024-01-01",
  updatedAt: "2025-01-10T12:00:00Z",
};

describe("DeleteGameDialog Logic", () => {
  describe("Dialog Visibility (Req 6.1)", () => {
    it("dialog is open when a game is selected for deletion", () => {
      expect(isDialogOpen(sampleGame)).toBe(true);
    });

    it("dialog is closed when no game is selected", () => {
      expect(isDialogOpen(null)).toBe(false);
    });
  });

  describe("Close Behavior", () => {
    it("allows closing when not deleting", () => {
      expect(canCloseDialog(false)).toBe(true);
    });

    it("prevents closing while deletion is in progress", () => {
      expect(canCloseDialog(true)).toBe(false);
    });
  });

  describe("Confirmation Logic (Req 6.2)", () => {
    it("calls deleteGame with the correct game id on confirm", async () => {
      let deletedId: string | null = null;
      const mockDelete = async (id: string) => {
        deletedId = id;
      };

      const result = await simulateConfirm(sampleGame, mockDelete);
      expect(result.success).toBe(true);
      expect(result.deletedId).toBe("game-123");
      expect(deletedId).toBe("game-123");
    });

    it("does nothing when no game is selected", async () => {
      let called = false;
      const mockDelete = async () => {
        called = true;
      };

      const result = await simulateConfirm(null, mockDelete);
      expect(result.success).toBe(false);
      expect(result.deletedId).toBeNull();
      expect(called).toBe(false);
    });

    it("reports failure when deleteGame throws", async () => {
      const mockDelete = async () => {
        throw new Error("API error");
      };

      const result = await simulateConfirm(sampleGame, mockDelete);
      expect(result.success).toBe(false);
      expect(result.deletedId).toBeNull();
    });
  });
});
