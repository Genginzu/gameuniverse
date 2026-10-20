/**
 * Every route below used to run without any auth check (anonymous IGDB /
 * Metacritic calls, similar-games CRUD). They must now reject non-admins
 * before reading the body or touching any data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: mockFrom })),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { GET as bulkFields } from "@/app/api/admin/bulk-import/fields/route";
import { GET as bulkGames } from "@/app/api/admin/bulk-import/games/route";
import { POST as bulkSync } from "@/app/api/admin/bulk-import/sync/route";
import { POST as bulkMetascore } from "@/app/api/admin/bulk-import/sync-metascore/route";
import { GET as charsList } from "@/app/api/admin/bulk-import-characters/characters/route";
import { GET as charsFields } from "@/app/api/admin/bulk-import-characters/fields/route";
import { POST as charsSync } from "@/app/api/admin/bulk-import-characters/sync/route";
import {
  GET as similarGet,
  POST as similarPost,
  DELETE as similarDelete,
} from "@/app/api/admin/games/[id]/similar-games/route";
import { POST as publicGameSync } from "@/app/api/games/[slug]/sync/route";

const req = (method = "GET") =>
  new NextRequest("http://localhost/api/x?entryId=e1", {
    method,
    body: method === "GET" ? undefined : JSON.stringify({ all: true, field: "cover", gameSlug: "x" }),
  });
const idParams = { params: Promise.resolve({ id: "g1" }) };
const slugParams = { params: Promise.resolve({ slug: "x" }) };

const handlers: Array<[string, () => Promise<Response>]> = [
  ["bulk-import/fields GET", () => bulkFields()],
  ["bulk-import/games GET", () => bulkGames(req())],
  ["bulk-import/sync POST", () => bulkSync(req("POST"))],
  ["bulk-import/sync-metascore POST", () => bulkMetascore(req("POST"))],
  ["bulk-import-characters/characters GET", () => charsList(req())],
  ["bulk-import-characters/fields GET", () => charsFields()],
  ["bulk-import-characters/sync POST", () => charsSync(req("POST"))],
  ["similar-games GET", () => similarGet(req(), idParams)],
  ["similar-games POST", () => similarPost(req("POST"), idParams)],
  ["similar-games DELETE", () => similarDelete(req("DELETE"), idParams)],
  ["games/[slug]/sync POST", () => publicGameSync(req("POST"), slugParams)],
];

describe("formerly unauthenticated admin routes", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockGetUser.mockReset();
  });

  it.each(handlers)("%s returns 401 for anonymous callers", async (_name, call) => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await call()).status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it.each(handlers)("%s returns 403 for a self-declared admin", async (_name, call) => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", app_metadata: {}, user_metadata: { role: "admin" } } },
      error: null,
    });
    expect((await call()).status).toBe(403);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
