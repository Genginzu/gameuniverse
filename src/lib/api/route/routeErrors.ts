import { NextResponse } from "next/server";

export type RouteErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "rate_limited"
  | "suspended"
  | "internal";

const STATUS: Record<RouteErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 400,
  conflict: 409,
  rate_limited: 429,
  suspended: 403,
  internal: 500,
};

interface RouteErrorOptions {
  details?: unknown;
  /** Extra top-level body fields kept for existing clients (suspendedUntil, retryAfter). */
  extra?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/** An expected refusal: defineRoute turns it into `{ error, code, details? }` without logging. */
export class RouteError extends Error {
  readonly status: number;

  constructor(
    readonly code: RouteErrorCode,
    message: string,
    readonly options: RouteErrorOptions = {}
  ) {
    super(message);
    this.name = "RouteError";
    this.status = STATUS[code];
  }

  toResponse(): NextResponse {
    const { details, extra, headers } = this.options;
    const body = {
      ...extra,
      error: this.message,
      code: this.code,
      ...(details === undefined ? {} : { details }),
    };
    return NextResponse.json(body, { status: this.status, headers });
  }
}

/** Extra top-level fields a client reads next to `error` and `code` (they cannot override those). */
type ErrorExtra = Record<string, unknown>;

export const unauthorized = () => new RouteError("unauthorized", "Authentication required");

export const forbidden = (message = "Forbidden", extra?: ErrorExtra) =>
  new RouteError("forbidden", message, { extra });

export const notFound = (message = "Not found", extra?: ErrorExtra) =>
  new RouteError("not_found", message, { extra });

export const conflict = (message = "Conflict", extra?: ErrorExtra) =>
  new RouteError("conflict", message, { extra });

export const validationError = (
  details?: unknown,
  message = "Invalid request",
  extra?: ErrorExtra
) => new RouteError("validation", message, { details, extra });

export const rateLimited = (retryAfter: number) =>
  new RouteError("rate_limited", "Too many requests", {
    extra: { retryAfter },
    headers: { "Retry-After": String(retryAfter) },
  });

export const suspended = (until: string | null) =>
  new RouteError("suspended", "Account suspended", { extra: { suspendedUntil: until } });

export const internalError = () => new RouteError("internal", "Internal server error");
