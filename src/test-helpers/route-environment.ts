/**
 * In-memory adapter of the route environment (`@/lib/api/route`). Route tests
 * pick the caller, suspension and rate-limit outcome here instead of mocking
 * `auth.getUser`, `profiles` or `consume_rate_limit`.
 */
import { afterEach, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";
import { installRouteEnvironment } from "@/lib/api/route/routeEnvironment";
import {
  rateLimitKey,
  type RateLimitAction,
  type RateLimitIdentity,
} from "@/lib/services/rateLimitService";

type Role = "admin" | "contributor" | "user";
type Caller = Role | User | null;

export interface TestRouteEnvironment {
  /** Sign in as a role (default "user") or as a given user. Returns the user. */
  signIn(caller?: Role | User): User;
  signOut(): void;
  suspend(until?: string | null): void;
  /** Every rate-limited call is refused with this Retry-After (seconds). */
  exceedRateLimit(retryAfter?: number): void;
  /** Rate-limit keys consumed so far, in call order. */
  readonly rateLimitHits: string[];
  readonly user: User | null;
}

export function testUser(role: Role = "user", overrides: Partial<User> = {}): User {
  return {
    id: `${role}-1`,
    email: `${role}@example.com`,
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
    app_metadata: role === "user" ? {} : { role },
    user_metadata: {},
    ...overrides,
  } as User;
}

function toUser(caller: Caller): User | null {
  if (caller === null) return null;
  return typeof caller === "string" ? testUser(caller) : caller;
}

/**
 * Install a fresh in-memory environment before each test of the file.
 * `signedInAs` sets the caller every test starts with (default: signed out).
 */
export function useTestRouteEnvironment(options: { signedInAs?: Caller } = {}) {
  let user: User | null = null;
  let suspension: { until: string | null } | null = null;
  let retryAfter: number | null = null;
  const rateLimitHits: string[] = [];
  let restore: (() => void) | null = null;

  beforeEach(() => {
    user = toUser(options.signedInAs ?? null);
    suspension = null;
    retryAfter = null;
    rateLimitHits.length = 0;
    restore = installRouteEnvironment({
      getUser: async () => user,
      getSuspension: async () => suspension,
      consumeRateLimit: async (action: RateLimitAction, identity: RateLimitIdentity) => {
        rateLimitHits.push(rateLimitKey(action, identity));
        return retryAfter === null ? { allowed: true } : { allowed: false, retryAfter };
      },
    });
  });

  afterEach(() => restore?.());

  const environment: TestRouteEnvironment = {
    signIn(caller = "user") {
      user = toUser(caller);
      return user as User;
    },
    signOut() {
      user = null;
    },
    suspend(until = null) {
      suspension = { until };
    },
    exceedRateLimit(seconds = 60) {
      retryAfter = seconds;
    },
    get rateLimitHits() {
      return rateLimitHits;
    },
    get user() {
      return user;
    },
  };
  return environment;
}
