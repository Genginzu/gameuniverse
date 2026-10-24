import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { logger } from "@/lib/logger";
import type { RateLimitAction } from "@/lib/services/rateLimitService";
import { getUserRoleFromUser } from "@/lib/utils/userRole";
import { parseBody, parseParams, parseQuery } from "./parseInput";
import { currentRouteEnvironment } from "./routeEnvironment";
import {
  RouteError,
  forbidden,
  internalError,
  rateLimited,
  suspended,
  unauthorized,
} from "./routeErrors";

export type RouteAuth = "required" | "optional" | "admin";
type Schema = z.ZodType | undefined;
type Infer<S extends Schema, Fallback> = S extends z.ZodType ? z.output<S> : Fallback;

export interface RouteConfig<
  A extends RouteAuth = RouteAuth,
  B extends Schema = Schema,
  Q extends Schema = Schema,
  P extends Schema = Schema,
> {
  auth: A;
  /** Action from RATE_LIMITS charged to the caller (user id, else client IP). */
  rateLimit?: RateLimitAction;
  /** The route publishes user content: suspended accounts get 403 `suspended`. */
  writesContent?: boolean;
  body?: B;
  query?: Q;
  params?: P;
}

export interface RouteContext<
  A extends RouteAuth = RouteAuth,
  B extends Schema = undefined,
  Q extends Schema = undefined,
  P extends Schema = undefined,
> {
  request: NextRequest;
  user: A extends "optional" ? User | null : User;
  body: Infer<B, undefined>;
  query: Infer<Q, undefined>;
  params: Infer<P, Record<string, string>>;
}

export type RouteHandler<
  A extends RouteAuth = RouteAuth,
  B extends Schema = undefined,
  Q extends Schema = undefined,
  P extends Schema = undefined,
> = (context: RouteContext<A, B, Q, P>) => Response | Promise<Response>;

/** Context Next passes to a route handler; `params` only exists on dynamic segments. */
type NextRouteContext = { params: Promise<Record<string, string | string[]>> };

async function authenticate(auth: RouteAuth): Promise<User | null> {
  const user = await currentRouteEnvironment().getUser();
  if (!user) {
    if (auth === "optional") return null;
    throw unauthorized();
  }
  if (auth === "admin" && getUserRoleFromUser(user) !== "admin") {
    throw forbidden("Admin access required");
  }
  return user;
}

/** Suspension before rate limit: a refused suspended account does not burn its quota. */
async function admit(config: RouteConfig, request: NextRequest, user: User | null) {
  const environment = currentRouteEnvironment();
  if (config.writesContent && user) {
    const suspension = await environment.getSuspension(user.id);
    if (suspension) throw suspended(suspension.until);
  }
  if (config.rateLimit) {
    const decision = await environment.consumeRateLimit(
      config.rateLimit,
      user ? { userId: user.id } : { request }
    );
    if (!decision.allowed) throw rateLimited(decision.retryAfter);
  }
}

export function defineRoute<
  A extends RouteAuth,
  B extends Schema = undefined,
  Q extends Schema = undefined,
  P extends Schema = undefined,
>(config: RouteConfig<A, B, Q, P>, handler: RouteHandler<A, B, Q, P>) {
  return async (request: NextRequest, nextContext?: NextRouteContext): Promise<Response> => {
    try {
      const user = await authenticate(config.auth);
      await admit(config, request, user);
      const rawParams = (await nextContext?.params) ?? {};
      return await handler({
        request,
        user,
        params: config.params ? parseParams(rawParams, config.params) : rawParams,
        query: config.query ? parseQuery(request, config.query) : undefined,
        body: config.body ? await parseBody(request, config.body) : undefined,
      } as RouteContext<A, B, Q, P>);
    } catch (error) {
      if (error instanceof RouteError) return error.toResponse();
      logger.error("Unhandled API route error", {
        error,
        method: request.method,
        path: new URL(request.url).pathname,
      });
      return internalError().toResponse();
    }
  };
}
