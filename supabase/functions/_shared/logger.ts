/**
 * Structured logger for Supabase Edge Functions (Deno).
 *
 * Outputs JSON lines that are picked up by the Supabase function logs.
 * Mirrors the API of `src/lib/logger.ts` to ease porting code from
 * the Next.js codebase.
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

const minLevel: LogLevel = "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      message: err.message,
      name: err.name,
      ...(err.stack ? { stack: err.stack } : {}),
    };
  }
  if (err !== null && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    return {
      ...(obj.message ? { message: String(obj.message) } : {}),
      ...(obj.code ? { code: obj.code } : {}),
      ...(obj.details ? { details: obj.details } : {}),
      ...(obj.hint ? { hint: obj.hint } : {}),
      ...(!obj.message && !obj.code ? obj : {}),
    };
  }
  return { message: String(err) };
}

function log(level: LogLevel, message: string, data?: LogPayload): void {
  if (!shouldLog(level)) return;

  const normalized = data ? { ...data } : undefined;
  if (normalized?.error) {
    normalized.error = formatError(normalized.error);
  }

  const entry = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...normalized,
  };
  const line = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      // eslint-disable-next-line no-console
      console.log(line);
  }
}

export const logger = {
  debug: (message: string, data?: LogPayload) => log("debug", message, data),
  info: (message: string, data?: LogPayload) => log("info", message, data),
  warn: (message: string, data?: LogPayload) => log("warn", message, data),
  error: (message: string, data?: LogPayload) => log("error", message, data),
};
