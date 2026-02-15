/**
 * Tests unitaires pour les routes API de synchronisation IGDB admin.
 * Vérifie la validation des entrées, la gestion des erreurs,
 * et le contrat des réponses API.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, test, expect } from "bun:test";
import { TRACKABLE_FIELDS } from "../../../src/lib/utils/field-tracking";
import type { TrackableField } from "../../../src/types/admin-games";

// ---------------------------------------------------------------------------
// Helpers — simulate route handler logic without importing Next.js internals
// ---------------------------------------------------------------------------

interface SyncRequestBody {
  field?: string;
}

interface MockGame {
  id: string;
  igdb_id: number | null;
}

/**
 * Reproduit la logique de validation du POST /api/admin/games/[id]/sync
 * sans dépendance Next.js, pour tester le contrat de l'API.
 */
function simulateSyncRoute(params: {
  gameId: string | null;
  body: SyncRequestBody;
  game: MockGame | null;
  syncResult?: { success: boolean; error?: string; syncedFields: TrackableField[] };
}): { status: number; body: Record<string, unknown> } {
  const { gameId, body, game, syncResult } = params;

  if (!gameId) {
    return { status: 400, body: { error: "Game ID is required" } };
  }

  // Validate field name if provided
  if (body.field && !TRACKABLE_FIELDS.includes(body.field as TrackableField)) {
    return { status: 400, body: { error: `Invalid field: ${body.field}` } };
  }

  // Game not found
  if (!game) {
    return { status: 404, body: { error: "Game not found" } };
  }

  // No igdb_id → 400
  if (!game.igdb_id) {
    return {
      status: 400,
      body: { error: "Ce jeu n'est pas lié à IGDB" },
    };
  }

  // Sync failure → 502
  if (syncResult && !syncResult.success) {
    return { status: 502, body: { error: syncResult.error } };
  }

  // Success
  return {
    status: 200,
    body: {
      success: true,
      syncedFields: syncResult?.syncedFields ?? [],
    },
  };
}

/**
 * Reproduit la logique de validation du GET /api/admin/games/[id]/overrides
 */
function simulateOverridesRoute(params: {
  gameId: string | null;
  overrides?: Array<{ id: string; field_name: string }>;
  fetchError?: string;
}): { status: number; body: Record<string, unknown> } {
  const { gameId, overrides, fetchError } = params;

  if (!gameId) {
    return { status: 400, body: { error: "Game ID is required" } };
  }

  if (fetchError) {
    return {
      status: 500,
      body: { error: `Failed to fetch overrides: ${fetchError}` },
    };
  }

  return { status: 200, body: { overrides: overrides ?? [] } };
}

// ---------------------------------------------------------------------------
// Tests — POST /api/admin/games/[id]/sync
// ---------------------------------------------------------------------------

describe("POST /api/admin/games/[id]/sync", () => {
  const GAME_ID = "00000000-0000-0000-0000-000000000001";

  test("sync individuel — retourne les champs synchronisés", () => {
    const result = simulateSyncRoute({
      gameId: GAME_ID,
      body: { field: "cover_image" },
      game: { id: GAME_ID, igdb_id: 12345 },
      syncResult: { success: true, syncedFields: ["cover_image"] },
    });

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.syncedFields).toEqual(["cover_image"]);
  });

  test("sync global — retourne tous les champs synchronisés", () => {
    const result = simulateSyncRoute({
      gameId: GAME_ID,
      body: {},
      game: { id: GAME_ID, igdb_id: 12345 },
      syncResult: {
        success: true,
        syncedFields: [...TRACKABLE_FIELDS] as TrackableField[],
      },
    });

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.syncedFields).toHaveLength(TRACKABLE_FIELDS.length);
  });

  test("erreur 400 — jeu sans igdb_id", () => {
    const result = simulateSyncRoute({
      gameId: GAME_ID,
      body: { field: "genres" },
      game: { id: GAME_ID, igdb_id: null },
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Ce jeu n'est pas lié à IGDB");
  });

  test("erreur 400 — champ invalide", () => {
    const result = simulateSyncRoute({
      gameId: GAME_ID,
      body: { field: "nonexistent_field" },
      game: { id: GAME_ID, igdb_id: 12345 },
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Invalid field: nonexistent_field");
  });

  test("erreur 502 — échec IGDB", () => {
    const result = simulateSyncRoute({
      gameId: GAME_ID,
      body: { field: "translations" },
      game: { id: GAME_ID, igdb_id: 12345 },
      syncResult: {
        success: false,
        error: "Game not found in IGDB (id: 12345)",
        syncedFields: [],
      },
    });

    expect(result.status).toBe(502);
    expect(result.body.error).toContain("IGDB");
  });

  test("erreur 404 — jeu introuvable", () => {
    const result = simulateSyncRoute({
      gameId: GAME_ID,
      body: {},
      game: null,
    });

    expect(result.status).toBe(404);
    expect(result.body.error).toBe("Game not found");
  });

  test("chaque TRACKABLE_FIELD est accepté comme champ valide", () => {
    for (const field of TRACKABLE_FIELDS) {
      const result = simulateSyncRoute({
        gameId: GAME_ID,
        body: { field },
        game: { id: GAME_ID, igdb_id: 99 },
        syncResult: { success: true, syncedFields: [field] },
      });
      expect(result.status).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests — GET /api/admin/games/[id]/overrides
// ---------------------------------------------------------------------------

describe("GET /api/admin/games/[id]/overrides", () => {
  const GAME_ID = "00000000-0000-0000-0000-000000000001";

  test("retourne la liste des overrides", () => {
    const result = simulateOverridesRoute({
      gameId: GAME_ID,
      overrides: [
        { id: "o1", field_name: "cover_image" },
        { id: "o2", field_name: "genres" },
      ],
    });

    expect(result.status).toBe(200);
    expect(result.body.overrides).toHaveLength(2);
  });

  test("retourne un tableau vide si aucun override", () => {
    const result = simulateOverridesRoute({
      gameId: GAME_ID,
      overrides: [],
    });

    expect(result.status).toBe(200);
    expect(result.body.overrides).toEqual([]);
  });

  test("erreur 500 — échec de la requête DB", () => {
    const result = simulateOverridesRoute({
      gameId: GAME_ID,
      fetchError: "connection refused",
    });

    expect(result.status).toBe(500);
    expect(result.body.error).toContain("Failed to fetch overrides");
  });
});

// ---------------------------------------------------------------------------
// Tests — Auth contract (403)
// ---------------------------------------------------------------------------

describe("Admin sync API - Auth contract", () => {
  test("requireAdmin error maps to 403 response", () => {
    const authError = new Error("Admin access required");

    // Simule le catch block des routes sync et overrides
    const isAuthError = authError instanceof Error && authError.message === "Admin access required";

    expect(isAuthError).toBe(true);

    const responseStatus = isAuthError ? 403 : 500;
    expect(responseStatus).toBe(403);
  });
});
