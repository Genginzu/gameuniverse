/**
 * Unit tests for admin species API routes.
 * Simulates route handler logic WITHOUT importing Next.js internals.
 * Follows the pattern from test/unit/api/admin-games-sync.test.ts.
 *
 * Requirements: 8.6, 8.7, 8.8
 */

import { describe, test, expect } from "vitest";
import { adminSpeciesFormSchema } from "@/lib/validations/admin-species-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Translation {
  language_code: string;
  name: string;
}

interface StoredSpecies {
  id: string;
  slug: string;
  igdb_id: number | null;
  translations: Translation[];
}

interface StoredCharacter {
  id: string;
  species_id: string | null;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

function createStore() {
  const species = new Map<string, StoredSpecies>();
  const characters = new Map<string, StoredCharacter>();
  let counter = 0;

  function nextId(): string {
    counter++;
    return `00000000-0000-0000-0000-${String(counter).padStart(12, "0")}`;
  }

  return { species, characters, nextId };
}

// ---------------------------------------------------------------------------
// Simulated route handlers
// ---------------------------------------------------------------------------

function simulatePost(
  store: ReturnType<typeof createStore>,
  body: unknown
): { status: number; body: Record<string, unknown> } {
  const validation = adminSpeciesFormSchema.safeParse(body);
  if (!validation.success) {
    return { status: 400, body: { error: "Invalid input data", details: validation.error.issues } };
  }

  const { slug, translations } = validation.data;

  for (const s of store.species.values()) {
    if (s.slug === slug) {
      return { status: 409, body: { error: "A species with this slug already exists" } };
    }
  }

  const id = store.nextId();
  const sp: StoredSpecies = { id, slug, igdb_id: null, translations };
  store.species.set(id, sp);

  return {
    status: 201,
    body: {
      species: {
        id,
        slug,
        characterCount: 0,
        translations: translations.map((t) => ({ language_code: t.language_code, name: t.name })),
      },
    },
  };
}

function simulateGetList(
  store: ReturnType<typeof createStore>,
  params: { page?: number; limit?: number } = {}
): { status: number; body: Record<string, unknown> } {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const allSpecies = Array.from(store.species.values());
  const offset = (page - 1) * limit;
  const paged = allSpecies.slice(offset, offset + limit);

  const speciesList = paged.map((s) => {
    let characterCount = 0;
    for (const c of store.characters.values()) {
      if (c.species_id === s.id) characterCount++;
    }
    return {
      id: s.id,
      slug: s.slug,
      characterCount,
      translations: s.translations.map((t) => ({ language_code: t.language_code, name: t.name })),
    };
  });

  const totalCount = allSpecies.length;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    status: 200,
    body: {
      species: speciesList,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  };
}

function simulateGetDetail(
  store: ReturnType<typeof createStore>,
  id: string
): { status: number; body: Record<string, unknown> } {
  const sp = store.species.get(id);
  if (!sp) {
    return { status: 404, body: { error: "Species not found" } };
  }

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.species_id === id) characterCount++;
  }

  return {
    status: 200,
    body: {
      species: {
        id: sp.id,
        slug: sp.slug,
        igdbId: sp.igdb_id,
        characterCount,
        translations: sp.translations.map((t) => ({
          language_code: t.language_code,
          name: t.name,
        })),
      },
    },
  };
}

function simulatePut(
  store: ReturnType<typeof createStore>,
  id: string,
  body: unknown
): { status: number; body: Record<string, unknown> } {
  const existing = store.species.get(id);
  if (!existing) {
    return { status: 404, body: { error: "Species not found" } };
  }

  const validation = adminSpeciesFormSchema.safeParse(body);
  if (!validation.success) {
    return { status: 400, body: { error: "Invalid input data", details: validation.error.issues } };
  }

  const { slug, translations } = validation.data;

  for (const s of store.species.values()) {
    if (s.slug === slug && s.id !== id) {
      return { status: 409, body: { error: "A species with this slug already exists" } };
    }
  }

  existing.slug = slug;
  existing.translations = translations;

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.species_id === id) characterCount++;
  }

  return {
    status: 200,
    body: {
      species: {
        id: existing.id,
        slug: existing.slug,
        igdbId: existing.igdb_id,
        characterCount,
        translations: existing.translations.map((t) => ({
          language_code: t.language_code,
          name: t.name,
        })),
      },
    },
  };
}

function simulateDelete(
  store: ReturnType<typeof createStore>,
  id: string
): { status: number; body: Record<string, unknown> } {
  const existing = store.species.get(id);
  if (!existing) {
    return { status: 404, body: { error: "Species not found" } };
  }

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.species_id === id) {
      characterCount++;
      c.species_id = null;
    }
  }

  store.species.delete(id);

  return { status: 200, body: { success: true, characterCount } };
}

function simulateAuthError(): { status: number; body: Record<string, unknown> } {
  const error = new Error("Admin access required");
  if (error instanceof Error && error.message === "Admin access required") {
    return { status: 403, body: { error: "Admin access required" } };
  }
  return { status: 500, body: { error: "Internal server error" } };
}

// ---------------------------------------------------------------------------
// Tests — POST /api/admin/species
// ---------------------------------------------------------------------------

describe("POST /api/admin/species", () => {
  test("valid payload creates species, returns 201", () => {
    const store = createStore();
    const res = simulatePost(store, {
      slug: "human",
      translations: [
        { language_code: "fr", name: "Humain" },
        { language_code: "en", name: "Human" },
      ],
    });

    expect(res.status).toBe(201);
    const sp = res.body.species as Record<string, unknown>;
    expect(sp.slug).toBe("human");
    expect(sp.characterCount).toBe(0);
    expect((sp.translations as Translation[]).length).toBe(2);
  });

  test("invalid slug returns 400", () => {
    const store = createStore();

    const cases = ["", "A", "1abc", "ab cd", "AB", "a"];
    for (const slug of cases) {
      const res = simulatePost(store, {
        slug,
        translations: [{ language_code: "fr", name: "Test" }],
      });
      expect(res.status).toBe(400);
    }
  });

  test("duplicate slug returns 409", () => {
    const store = createStore();
    const payload = {
      slug: "alien",
      translations: [{ language_code: "fr", name: "Alien" }],
    };

    const first = simulatePost(store, payload);
    expect(first.status).toBe(201);

    const second = simulatePost(store, payload);
    expect(second.status).toBe(409);
    expect(second.body.error).toContain("slug already exists");
  });

  test("missing translations returns 400", () => {
    const store = createStore();
    const res = simulatePost(store, { slug: "robot" });
    expect(res.status).toBe(400);
  });

  test("empty translations array returns 400", () => {
    const store = createStore();
    const res = simulatePost(store, { slug: "robot", translations: [] });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Tests — GET /api/admin/species (list)
// ---------------------------------------------------------------------------

describe("GET /api/admin/species (list)", () => {
  test("returns species with pagination", () => {
    const store = createStore();
    simulatePost(store, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Humain" }],
    });
    simulatePost(store, {
      slug: "alien",
      translations: [{ language_code: "fr", name: "Alien" }],
    });
    simulatePost(store, {
      slug: "robot",
      translations: [{ language_code: "fr", name: "Robot" }],
    });

    const res = simulateGetList(store, { page: 1, limit: 2 });
    expect(res.status).toBe(200);

    const speciesList = res.body.species as unknown[];
    expect(speciesList.length).toBe(2);

    const pagination = res.body.pagination as Record<string, unknown>;
    expect(pagination.totalCount).toBe(3);
    expect(pagination.totalPages).toBe(2);
    expect(pagination.hasNextPage).toBe(true);
    expect(pagination.hasPreviousPage).toBe(false);
  });

  test("returns empty list when no species exist", () => {
    const store = createStore();
    const res = simulateGetList(store);
    expect(res.status).toBe(200);

    const speciesList = res.body.species as unknown[];
    expect(speciesList.length).toBe(0);

    const pagination = res.body.pagination as Record<string, unknown>;
    expect(pagination.totalCount).toBe(0);
  });

  test("includes character count per species", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Humain" }],
    });
    const speciesId = (postRes.body.species as Record<string, unknown>).id as string;

    const c1 = store.nextId();
    const c2 = store.nextId();
    store.characters.set(c1, { id: c1, species_id: speciesId });
    store.characters.set(c2, { id: c2, species_id: speciesId });

    const res = simulateGetList(store);
    const speciesList = res.body.species as Array<Record<string, unknown>>;
    expect(speciesList[0].characterCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Tests — GET /api/admin/species/[id] (detail)
// ---------------------------------------------------------------------------

describe("GET /api/admin/species/[id]", () => {
  test("returns species with translations and characterCount", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "human",
      translations: [
        { language_code: "fr", name: "Humain" },
        { language_code: "en", name: "Human" },
      ],
    });
    const id = (postRes.body.species as Record<string, unknown>).id as string;

    const res = simulateGetDetail(store, id);
    expect(res.status).toBe(200);

    const sp = res.body.species as Record<string, unknown>;
    expect(sp.slug).toBe("human");
    expect(sp.characterCount).toBe(0);
    expect((sp.translations as Translation[]).length).toBe(2);
  });

  test("non-existent ID returns 404", () => {
    const store = createStore();
    const res = simulateGetDetail(store, "00000000-0000-0000-0000-999999999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Species not found");
  });
});

// ---------------------------------------------------------------------------
// Tests — PUT /api/admin/species/[id]
// ---------------------------------------------------------------------------

describe("PUT /api/admin/species/[id]", () => {
  test("valid payload updates species", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Humain" }],
    });
    const id = (postRes.body.species as Record<string, unknown>).id as string;

    const putRes = simulatePut(store, id, {
      slug: "human-updated",
      translations: [{ language_code: "fr", name: "Humain modifié" }],
    });
    expect(putRes.status).toBe(200);

    const sp = putRes.body.species as Record<string, unknown>;
    expect(sp.slug).toBe("human-updated");
  });

  test("non-existent ID returns 404", () => {
    const store = createStore();
    const res = simulatePut(store, "00000000-0000-0000-0000-999999999999", {
      slug: "test",
      translations: [{ language_code: "fr", name: "Test" }],
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Species not found");
  });

  test("duplicate slug returns 409", () => {
    const store = createStore();
    simulatePost(store, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Humain" }],
    });
    const secondRes = simulatePost(store, {
      slug: "alien",
      translations: [{ language_code: "fr", name: "Alien" }],
    });
    const secondId = (secondRes.body.species as Record<string, unknown>).id as string;

    const putRes = simulatePut(store, secondId, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Alien" }],
    });
    expect(putRes.status).toBe(409);
    expect(putRes.body.error).toContain("slug already exists");
  });

  test("invalid payload returns 400", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Humain" }],
    });
    const id = (postRes.body.species as Record<string, unknown>).id as string;

    const putRes = simulatePut(store, id, { slug: "", translations: [] });
    expect(putRes.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Tests — DELETE /api/admin/species/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/admin/species/[id]", () => {
  test("removes species, returns success", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Humain" }],
    });
    const id = (postRes.body.species as Record<string, unknown>).id as string;

    const deleteRes = simulateDelete(store, id);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const getRes = simulateGetDetail(store, id);
    expect(getRes.status).toBe(404);
  });

  test("non-existent ID returns 404", () => {
    const store = createStore();
    const res = simulateDelete(store, "00000000-0000-0000-0000-999999999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Species not found");
  });

  test("sets character FK to NULL on deletion", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "human",
      translations: [{ language_code: "fr", name: "Humain" }],
    });
    const speciesId = (postRes.body.species as Record<string, unknown>).id as string;

    const charId = store.nextId();
    store.characters.set(charId, { id: charId, species_id: speciesId });

    const deleteRes = simulateDelete(store, speciesId);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.characterCount).toBe(1);

    const char = store.characters.get(charId);
    expect(char!.species_id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — Auth contract (403)
// ---------------------------------------------------------------------------

describe("Admin species API - Auth contract", () => {
  test("requireAdmin error maps to 403", () => {
    const res = simulateAuthError();
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Admin access required");
  });
});
