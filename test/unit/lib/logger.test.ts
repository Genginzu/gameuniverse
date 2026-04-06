import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, createRequestLogger } from "@/lib/logger";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("VERCEL", "");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("logger", () => {
  it("info calls console.log", () => {
    logger.info("test message");
    expect(console.log).toHaveBeenCalled();
  });

  it("error calls console.error", () => {
    logger.error("error message");
    expect(console.error).toHaveBeenCalled();
  });

  it("warn calls console.warn", () => {
    logger.warn("warn message");
    expect(console.warn).toHaveBeenCalled();
  });

  it("debug calls console.debug in dev", () => {
    logger.debug("debug message");
    expect(console.debug).toHaveBeenCalled();
  });

  it("info includes data payload", () => {
    logger.info("with data", { key: "value" });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[INFO]"),
      "with data",
      expect.objectContaining({ key: "value" })
    );
  });
});

describe("createRequestLogger", () => {
  it("includes requestId in log data", () => {
    const reqLogger = createRequestLogger("req-123");
    reqLogger.info("request log", { path: "/api" });
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      "request log",
      expect.objectContaining({ requestId: "req-123", path: "/api" })
    );
  });
});
