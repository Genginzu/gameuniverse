/**
 * Structured logger for server-side code.
 *
 * On Vercel (production), outputs JSON lines so logs are searchable
 * and filterable in the Vercel dashboard / Log Drains.
 * In development, outputs human-readable colored messages.
 *
 * Supports optional requestId for request tracing / correlation.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Game imported", { slug, igdbId });
 *   logger.error("Import failed", { igdbId, error });
 *
 *   // With request tracing
 *   import { createRequestLogger } from "@/lib/logger";
 *   const log = createRequestLogger(requestId);
 *   log.info("Processing request", { path: "/api/games" });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;
const minLevel = isProduction ? "info" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      message: err.message,
      name: err.name,
      ...(err.stack && !isProduction ? { stack: err.stack } : {}),
      ...(err.cause ? { cause: formatError(err.cause) } : {}),
    };
  }
  return { message: String(err) };
}

function log(level: LogLevel, message: string, data?: LogPayload) {
  if (!shouldLog(level)) return;

  // Normalize error objects in data
  const normalized = data ? { ...data } : undefined;
  if (normalized?.error) {
    normalized.error = formatError(normalized.error);
  }

  if (isVercel || isProduction) {
    // Structured JSON for Vercel Log Drains / runtime logs
    const entry = {
      level,
      msg: message,
      ts: new Date().toISOString(),
      ...normalized,
    };
    const line = JSON.stringify(entry);

    switch (level) {
      case "error":
        // eslint-disable-next-line no-console
        console.error(line);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(line);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(line);
    }
  } else {
    // Human-readable for local dev
    const prefix = `[${level.toUpperCase()}]`;
    const parts: unknown[] = [prefix, message];
    if (normalized && Object.keys(normalized).length > 0) {
      parts.push(normalized);
    }

    switch (level) {
      case "error":
        // eslint-disable-next-line no-console
        console.error(...parts);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(...parts);
        break;
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(...parts);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(...parts);
    }
  }
}

export const logger = {
  debug: (message: string, data?: LogPayload) => log("debug", message, data),
  info: (message: string, data?: LogPayload) => log("info", message, data),
  warn: (message: string, data?: LogPayload) => log("warn", message, data),
  error: (message: string, data?: LogPayload) => log("error", message, data),
};

/**
 * Create a logger scoped to a specific request via its correlation ID.
 * Every log entry will include the requestId for easy filtering.
 */
export function createRequestLogger(requestId: string) {
  const withRequestId = (data?: LogPayload): LogPayload => ({
    ...data,
    requestId,
  });

  return {
    debug: (message: string, data?: LogPayload) => log("debug", message, withRequestId(data)),
    info: (message: string, data?: LogPayload) => log("info", message, withRequestId(data)),
    warn: (message: string, data?: LogPayload) => log("warn", message, withRequestId(data)),
    error: (message: string, data?: LogPayload) => log("error", message, withRequestId(data)),
  };
}
