/**
 * Shared generators and request helpers for achievements CRUD property tests.
 */
import { vi } from "vitest";
import * as fc from "fast-check";
import type { NextRequest } from "next/server";

// --- Generators ---

const CATEGORIES = ["library", "playtime", "reviews", "social", "collections"] as const;
const TIERS = ["bronze", "silver", "gold"] as const;

export const validKeyGen = fc.stringMatching(/^[a-z][a-z0-9_]{0,20}$/);
export const validCategoryGen = fc.constantFrom(...CATEGORIES);
export const validTierGen = fc.constantFrom(...TIERS);
export const positiveIntGen = fc.integer({ min: 1, max: 10000 });
export const validIconGen = fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/);
export const validNameGen = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length >= 1);
export const validDescGen = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length >= 1);
export const sortOrderGen = fc.integer({ min: 0, max: 1000 });

export const validAchievementGen = fc.record({
  key: validKeyGen,
  category: validCategoryGen,
  tier: validTierGen,
  threshold: positiveIntGen,
  xpValue: positiveIntGen,
  icon: validIconGen,
  nameFr: validNameGen,
  nameEn: validNameGen,
  descriptionFr: validDescGen,
  descriptionEn: validDescGen,
  sortOrder: sortOrderGen,
});

export const pageGen = fc.integer({ min: 1, max: 50 });
export const limitGen = fc.integer({ min: 1, max: 100 });
export const sortByGen = fc.constantFrom(
  "key",
  "category",
  "tier",
  "threshold",
  "xp_value",
  "name",
  "sort_order"
);
export const sortOrderDirGen = fc.constantFrom("asc" as const, "desc" as const);
export const localeGen = fc.constantFrom("fr", "en");

// --- Request helpers ---

const BASE = "http://localhost/api/admin/achievements";

export function makeReq(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as NextRequest;
}

export function getReq(params: Record<string, string> = {}) {
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return makeReq(url.toString());
}

export function postReq(body: object) {
  return makeReq(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function putReq(id: string, body: object) {
  return makeReq(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function delReq(id: string, force = false) {
  const q = force ? "?force=true" : "";
  return makeReq(`${BASE}/${id}${q}`, { method: "DELETE" });
}

export function idGetReq(id: string) {
  return makeReq(`${BASE}/${id}`);
}

export function usageReq(id: string) {
  return makeReq(`${BASE}/${id}/usage`);
}

export function ctx(id = "11111111-2222-3333-4444-555555555555") {
  return { params: Promise.resolve({ id }) };
}

/** Convert camelCase form data to snake_case DB row */
export function toRow(data: Record<string, unknown>, id = "aaaa-bbbb-cccc-dddd") {
  return {
    id,
    key: data.key,
    category: data.category,
    tier: data.tier,
    threshold: data.threshold,
    xp_value: data.xpValue,
    icon: data.icon,
    name_fr: data.nameFr,
    name_en: data.nameEn,
    description_fr: data.descriptionFr,
    description_en: data.descriptionEn,
    sort_order: data.sortOrder,
  };
}

/** Mock select→eq→maybeSingle chain */
export function mockEqMaybe(data: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
      })),
    })),
  };
}

/** Mock select→eq→neq→maybeSingle chain */
export function mockEqNeqMaybe(data: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        neq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
        })),
      })),
    })),
  };
}
