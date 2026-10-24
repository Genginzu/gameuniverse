import type { User } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getActiveSuspension } from "@/lib/services/suspensionGuard";
import {
  consumeRateLimit,
  type RateLimitAction,
  type RateLimitDecision,
  type RateLimitIdentity,
} from "@/lib/services/rateLimitService";

/**
 * The I/O a route prologue depends on. Two adapters exist: Supabase in
 * production, and the in-memory one from `@/test-helpers/route-environment`.
 */
export interface RouteEnvironment {
  getUser(): Promise<User | null>;
  getSuspension(userId: string): Promise<{ until: string | null } | null>;
  consumeRateLimit(action: RateLimitAction, identity: RateLimitIdentity): Promise<RateLimitDecision>;
}

export const supabaseRouteEnvironment: RouteEnvironment = {
  async getUser() {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return error || !user ? null : user;
  },
  getSuspension: getActiveSuspension,
  consumeRateLimit,
};

let installed: RouteEnvironment | null = null;

export function currentRouteEnvironment(): RouteEnvironment {
  return installed ?? supabaseRouteEnvironment;
}

/** Swap the environment (tests only). Returns a function restoring the previous one. */
export function installRouteEnvironment(environment: RouteEnvironment): () => void {
  const previous = installed;
  installed = environment;
  return () => {
    installed = previous;
  };
}
