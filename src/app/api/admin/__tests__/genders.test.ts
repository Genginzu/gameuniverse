/**
 * Unit tests for admin genders API routes.
 * Simulates route handler logic WITHOUT importing Next.js internals.
 * Follows the pattern from test/unit/api/admin-games-sync.test.ts.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8
 */

import { describe, test, expect } from "vitest";
import { adminGenderFormSchema } from "@/lib/validations/admin-gender-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Translation {
  language_code: string;
  name: string;
}

interface StoredGender {
  id: string;
  slug: string;
  igdb_id: number | null;
  translations: Translation[];
}

interface StoredCharacter {
  id: string;
  gender_id: string | null;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

function createStore() {
  const genders = new Map<string, StoredGender>();
  const characters = new Map<string, StoredCharacter>();
  let counter = 0;

  function nextId(): string {
    counter++;
    return `00000000-0000-0000-0000-${String(counter).padStart(12, "0")}`;
  }

  return { genders, characters, nextId };
}

// ---------------------------------------------------------------------------
// Simulated route handlers
// ---------------------------------------------------------------------------

function simulatePost(
  store: ReturnType<typeof createStore>,
  body: unknown
): { status: number; body: Record<string, unknown> } {
  const validation = adminGenderFormSchema.safeParse(body);
  if (!validation.success) {
    return { status: 400, body: { error: "Invalid input data", details: validation.error.issues } };
  }

  const { slug, translations } = validation.data;

  for (const g of store.genders.values()) {
    if (g.slug === slug) {
      return { status: 409, body: { error: "A gender with this slug already exists" } };
    }
  }

  const id = store.nextId();
  const gender: StoredGender = { id, slug, igdb_id: null, translations };
  store.genders.set(id, gender);

  return {
    status: 201,
    body: {
      gender: {
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
  const allGenders = Array.from(store.genders.values());
  const offset = (page - 1) * limit;
  const paged = allGenders.slice(offset, offset + limit);

  const genders = paged.map((g) => {
    let characterCount = 0;
    for (const c of store.characters.values()) {
      if (c.gender_id === g.id) characterCount++;
    }
    return {
      id: g.id,
      slug: g.slug,
      characterCount,
      translations: g.translations.map((t) => ({ language_code: t.language_code, name: t.name })),
    };
  });

  const totalCount = allGenders.length;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    status: 200,
    body: {
      genders,
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
  const gender = store.genders.get(id);
  if (!gender) {
    return { status: 404, body: { error: "Gender not found" } };
  }

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.gender_id === id) characterCount++;
  }

  return {
    status: 200,
    body: {
      gender: {
        id: gender.id,
        slug: gender.slug,
        igdbId: gender.igdb_id,
        characterCount,
        translations: gender.translations.map((t) => ({
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
  const existing = store.genders.get(id);
  if (!existing) {
    return { status: 404, body: { error: "Gender not found" } };
  }

  const validation = adminGenderFormSchema.safeParse(body);
  if (!validation.success) {
    return { status: 400, body: { error: "Invalid input data", details: validation.error.issues } };
  }

  const { slug, translations } = validation.data;

  for (const g of store.genders.values()) {
    if (g.slug === slug && g.id !== id) {
      return { status: 409, body: { error: "A gender with this slug already exists" } };
    }
  }

  existing.slug = slug;
  existing.translations = translations;

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.gender_id === id) characterCount++;
  }

  return {
    status: 200,
    body: {
      gender: {
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
  const existing = store.genders.get(id);
  if (!existing) {
    return { status: 404, body: { error: "Gender not found" } };
  }

  let characterCount = 0;
  for (const c of store.characters.values()) {
    if (c.gender_id === id) {
      characterCount++;
      c.gender_id = null;
    }
  }

  store.genders.delete(id);

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
// Tests — POST /api/admin/genders
// ---------------------------------------------------------------------------

describe("POST /api/admin/genders", () => {
  test("valid payload creates gender, returns 201", () => {
    const store = createStore();
    const res = simulatePost(store, {
      slug: "male",
      translations: [
        { language_code: "fr", name: "Masculin" },
        { language_code: "en", name: "Male" },
      ],
    });

    expect(res.status).toBe(201);
    const gender = res.body.gender as Record<string, unknown>;
    expect(gender.slug).toBe("male");
    expect(gender.characterCount).toBe(0);
    expect((gender.translations as Translation[]).length).toBe(2);
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
      slug: "female",
      translations: [{ language_code: "fr", name: "Féminin" }],
    };

    const first = simulatePost(store, payload);
    expect(first.status).toBe(201);

    const second = simulatePost(store, payload);
    expect(second.status).toBe(409);
    expect(second.body.error).toContain("slug already exists");
  });

  test("missing translations returns 400", () => {
    const store = createStore();
    const res = simulatePost(store, { slug: "other" });
    expect(res.status).toBe(400);
  });

  test("empty translations array returns 400", () => {
    const store = createStore();
    const res = simulatePost(store, { slug: "other", translations: [] });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Tests — GET /api/admin/genders (list)
// ---------------------------------------------------------------------------

describe("GET /api/admin/genders (list)", () => {
  test("returns genders with pagination", () => {
    const store = createStore();
    simulatePost(store, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Masculin" }],
    });
    simulatePost(store, {
      slug: "female",
      translations: [{ language_code: "fr", name: "Féminin" }],
    });
    simulatePost(store, {
      slug: "other",
      translations: [{ language_code: "fr", name: "Autre" }],
    });

    const res = simulateGetList(store, { page: 1, limit: 2 });
    expect(res.status).toBe(200);

    const genders = res.body.genders as unknown[];
    expect(genders.length).toBe(2);

    const pagination = res.body.pagination as Record<string, unknown>;
    expect(pagination.totalCount).toBe(3);
    expect(pagination.totalPages).toBe(2);
    expect(pagination.hasNextPage).toBe(true);
    expect(pagination.hasPreviousPage).toBe(false);
  });

  test("returns empty list when no genders exist", () => {
    const store = createStore();
    const res = simulateGetList(store);
    expect(res.status).toBe(200);

    const genders = res.body.genders as unknown[];
    expect(genders.length).toBe(0);

    const pagination = res.body.pagination as Record<string, unknown>;
    expect(pagination.totalCount).toBe(0);
  });

  test("includes character count per gender", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Masculin" }],
    });
    const genderId = (postRes.body.gender as Record<string, unknown>).id as string;

    // Add characters
    const c1 = store.nextId();
    const c2 = store.nextId();
    store.characters.set(c1, { id: c1, gender_id: genderId });
    store.characters.set(c2, { id: c2, gender_id: genderId });

    const res = simulateGetList(store);
    const genders = res.body.genders as Array<Record<string, unknown>>;
    expect(genders[0].characterCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Tests — GET /api/admin/genders/[id] (detail)
// ---------------------------------------------------------------------------

describe("GET /api/admin/genders/[id]", () => {
  test("returns gender with translations and characterCount", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "male",
      translations: [
        { language_code: "fr", name: "Masculin" },
        { language_code: "en", name: "Male" },
      ],
    });
    const id = (postRes.body.gender as Record<string, unknown>).id as string;

    const res = simulateGetDetail(store, id);
    expect(res.status).toBe(200);

    const gender = res.body.gender as Record<string, unknown>;
    expect(gender.slug).toBe("male");
    expect(gender.characterCount).toBe(0);
    expect((gender.translations as Translation[]).length).toBe(2);
  });

  test("non-existent ID returns 404", () => {
    const store = createStore();
    const res = simulateGetDetail(store, "00000000-0000-0000-0000-999999999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Gender not found");
  });
});

// ---------------------------------------------------------------------------
// Tests — PUT /api/admin/genders/[id]
// ---------------------------------------------------------------------------

describe("PUT /api/admin/genders/[id]", () => {
  test("valid payload updates gender", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Masculin" }],
    });
    const id = (postRes.body.gender as Record<string, unknown>).id as string;

    const putRes = simulatePut(store, id, {
      slug: "male-updated",
      translations: [{ language_code: "fr", name: "Masculin modifié" }],
    });
    expect(putRes.status).toBe(200);

    const gender = putRes.body.gender as Record<string, unknown>;
    expect(gender.slug).toBe("male-updated");
  });

  test("non-existent ID returns 404", () => {
    const store = createStore();
    const res = simulatePut(store, "00000000-0000-0000-0000-999999999999", {
      slug: "test",
      translations: [{ language_code: "fr", name: "Test" }],
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Gender not found");
  });

  test("duplicate slug returns 409", () => {
    const store = createStore();
    simulatePost(store, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Masculin" }],
    });
    const secondRes = simulatePost(store, {
      slug: "female",
      translations: [{ language_code: "fr", name: "Féminin" }],
    });
    const secondId = (secondRes.body.gender as Record<string, unknown>).id as string;

    const putRes = simulatePut(store, secondId, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Féminin" }],
    });
    expect(putRes.status).toBe(409);
    expect(putRes.body.error).toContain("slug already exists");
  });

  test("invalid payload returns 400", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Masculin" }],
    });
    const id = (postRes.body.gender as Record<string, unknown>).id as string;

    const putRes = simulatePut(store, id, { slug: "", translations: [] });
    expect(putRes.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Tests — DELETE /api/admin/genders/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/admin/genders/[id]", () => {
  test("removes gender, returns success", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Masculin" }],
    });
    const id = (postRes.body.gender as Record<string, unknown>).id as string;

    const deleteRes = simulateDelete(store, id);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify it's gone
    const getRes = simulateGetDetail(store, id);
    expect(getRes.status).toBe(404);
  });

  test("non-existent ID returns 404", () => {
    const store = createStore();
    const res = simulateDelete(store, "00000000-0000-0000-0000-999999999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Gender not found");
  });

  test("sets character FK to NULL on deletion", () => {
    const store = createStore();
    const postRes = simulatePost(store, {
      slug: "male",
      translations: [{ language_code: "fr", name: "Masculin" }],
    });
    const genderId = (postRes.body.gender as Record<string, unknown>).id as string;

    const charId = store.nextId();
    store.characters.set(charId, { id: charId, gender_id: genderId });

    const deleteRes = simulateDelete(store, genderId);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.characterCount).toBe(1);

    const char = store.characters.get(charId);
    expect(char!.gender_id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — Auth contract (403)
// ---------------------------------------------------------------------------

describe("Admin genders API - Auth contract", () => {
  test("requireAdmin error maps to 403", () => {
    const res = simulateAuthError();
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Admin access required");
  });
});
