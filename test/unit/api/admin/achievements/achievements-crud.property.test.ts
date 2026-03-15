/**
 * Property-based tests for achievements CRUD API — Properties 1, 2, 3, 5, 6.
 *
 * Uses fc.sample() + sequential for-loops to avoid concurrency issues
 * with shared mutable mocks (mockSupabaseFrom).
 *
 * **Validates: Requirements 1.2, 1.3, 1.4, 2.3, 2.5, 2.6, 3.1, 3.3**
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  validAchievementGen,
  pageGen,
  limitGen,
  sortByGen,
  sortOrderDirGen,
  localeGen,
  toRow,
  getReq,
  postReq,
  putReq,
  idGetReq,
  ctx,
  mockEqMaybe,
  mockEqNeqMaybe,
} from "./achievements-crud-helpers";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSupabaseFrom: ReturnType<typeof vi.fn> | null;

vi.mock("@/lib/auth-admin", () => ({
  requireAdmin: () => (mockRequireAdmin ? mockRequireAdmin() : Promise.resolve(true)),
}));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (...args: unknown[]) => (mockSupabaseFrom ? mockSupabaseFrom(...args) : {}),
    }),
}));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { GET, POST } = await import("@/app/api/admin/achievements/route");
const { GET: GET_ID, PUT } = await import("@/app/api/admin/achievements/[id]/route");

beforeEach(() => {
  mockRequireAdmin = vi.fn(() => Promise.resolve(true));
  mockSupabaseFrom = null;
});

/** Mock for GET list (no search): select returns count or data chain */
function mockListFrom(total: number, rows: unknown[]) {
  return vi.fn(() => ({
    select: vi.fn((_c: string, opts?: { count?: string; head?: boolean }) => {
      if (opts?.head) {
        const r = { count: total, error: null };
        return Object.assign(Promise.resolve(r), r);
      }
      return {
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: rows, error: null })),
        })),
      };
    }),
  }));
}

describe("Achievements CRUD Properties 1-3, 5-6", () => {
  /** P1: Pagination returns correct page size and count. **Validates: Requirements 1.2** */
  it("P1: returns at most limit items and correct totalCount", async () => {
    const samples = fc.sample(fc.tuple(pageGen, limitGen, fc.integer({ min: 0, max: 200 })), 100);
    for (const [page, limit, total] of samples) {
      const count = Math.max(0, Math.min(limit, total - (page - 1) * limit));
      const rows = Array.from({ length: count }, (_, i) =>
        toRow(
          {
            key: `k${i}`,
            category: "library",
            tier: "bronze",
            threshold: 1,
            xpValue: 10,
            icon: "i",
            nameFr: "n",
            nameEn: "n",
            descriptionFr: "d",
            descriptionEn: "d",
            sortOrder: i,
          },
          `id-${i}`
        )
      );
      mockSupabaseFrom = mockListFrom(total, rows);
      const res = await GET(getReq({ page: String(page), limit: String(limit) }));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.achievements.length).toBeLessThanOrEqual(limit);
      expect(body.pagination.totalCount).toBe(total);
    }
  });

  /** P2: Search filter returns only matching results. **Validates: Requirements 1.3** */
  it("P2: passes search term as ilike filter to Supabase", async () => {
    const samples = fc.sample(fc.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/), localeGen), 100);
    for (const [search, locale] of samples) {
      const orMock = vi.fn(() => ({
        order: vi.fn(() => ({ range: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
      }));
      const countOrMock = vi.fn(() => Promise.resolve({ count: 0, error: null }));
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn((_c: string, opts?: { head?: boolean }) =>
          opts?.head ? { or: countOrMock } : { or: orMock }
        ),
      }));
      const res = await GET(getReq({ search, locale }));
      expect(res.status).toBe(200);
      const nameCol = locale === "en" ? "name_en" : "name_fr";
      const expected = `key.ilike.%${search}%,${nameCol}.ilike.%${search}%`;
      expect(orMock).toHaveBeenCalledWith(expected);
      expect(countOrMock).toHaveBeenCalledWith(expected);
    }
  });

  /** P3: Sort order is respected. **Validates: Requirements 1.4** */
  it("P3: passes correct sort column and direction to Supabase", async () => {
    const samples = fc.sample(fc.tuple(sortByGen, sortOrderDirGen, localeGen), 100);
    for (const [sortBy, dir, locale] of samples) {
      const orderMock = vi.fn(() => ({
        range: vi.fn(() => Promise.resolve({ data: [], error: null })),
      }));
      mockSupabaseFrom = vi.fn(() => ({
        select: vi.fn((_c: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            const r = { count: 0, error: null };
            return Object.assign(Promise.resolve(r), r);
          }
          return { order: orderMock };
        }),
      }));
      const res = await GET(getReq({ sort_by: sortBy, sort_order: dir, locale }));
      expect(res.status).toBe(200);
      const expectedCol = sortBy === "name" ? (locale === "en" ? "name_en" : "name_fr") : sortBy;
      expect(orderMock).toHaveBeenCalledWith(expectedCol, { ascending: dir === "asc" });
    }
  });

  /** P5: Achievement key uniqueness. **Validates: Requirements 2.3, 2.6** */
  it("P5: second creation with same key returns 409", async () => {
    const samples = fc.sample(validAchievementGen, 100);
    for (const data of samples) {
      const row = toRow(data);
      // First POST: key check → null, then insert
      let c1 = 0;
      mockSupabaseFrom = vi.fn(() => {
        c1++;
        if (c1 === 1) return mockEqMaybe(null);
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: row, error: null })),
            })),
          })),
        };
      });
      const res1 = await POST(postReq(data));
      expect(res1.status).toBe(201);
      // Second POST: key check → existing
      mockSupabaseFrom = vi.fn(() => mockEqMaybe({ id: "existing" }));
      const res2 = await POST(postReq(data));
      expect(res2.status).toBe(409);
      expect((await res2.json()).error).toBe("Achievement key already exists");
    }
  });

  /** P6: CRUD round-trip. **Validates: Requirements 2.5, 3.1, 3.3** */
  describe("P6: CRUD round-trip", () => {
    it("create then fetch returns equivalent fields", async () => {
      const samples = fc.sample(validAchievementGen, 100);
      for (const data of samples) {
        const id = "rt-create-id";
        const row = toRow(data, id);
        let c = 0;
        mockSupabaseFrom = vi.fn(() => {
          c++;
          if (c === 1) return mockEqMaybe(null);
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: row, error: null })),
              })),
            })),
          };
        });
        const createRes = await POST(postReq(data));
        expect(createRes.status).toBe(201);
        const created = (await createRes.json()).achievement;
        // GET by ID
        mockSupabaseFrom = vi.fn(() => mockEqMaybe(row));
        const fetchRes = await GET_ID(idGetReq(id), ctx(id));
        expect(fetchRes.status).toBe(200);
        const fetched = (await fetchRes.json()).achievement;
        expect(fetched.key).toBe(created.key);
        expect(fetched.xpValue).toBe(created.xpValue);
      }
    });

    it("update then fetch returns updated values", async () => {
      const samples = fc.sample(validAchievementGen, 100);
      for (const updated of samples) {
        const id = "rt-update-id";
        const updatedRow = toRow(updated, id);
        let n = 0;
        mockSupabaseFrom = vi.fn(() => {
          n++;
          if (n === 1) return mockEqMaybe({ id });
          if (n === 2) return mockEqNeqMaybe(null);
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: updatedRow, error: null })),
                })),
              })),
            })),
          };
        });
        const putRes = await PUT(putReq(id, updated), ctx(id));
        expect(putRes.status).toBe(200);
        const putBody = (await putRes.json()).achievement;
        mockSupabaseFrom = vi.fn(() => mockEqMaybe(updatedRow));
        const fetchRes = await GET_ID(idGetReq(id), ctx(id));
        expect(fetchRes.status).toBe(200);
        const fetched = (await fetchRes.json()).achievement;
        expect(fetched.key).toBe(putBody.key);
        expect(fetched.xpValue).toBe(putBody.xpValue);
      }
    });
  });
});
