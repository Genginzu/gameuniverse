import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: mockSend } };
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const ORIGINAL_ENV = { ...process.env };

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns sent:false without calling Resend when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.RESEND_FROM_EMAIL = "noreply@example.com";

    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" });

    expect(result).toEqual({ sent: false, error: "Resend is not configured" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns sent:false without calling Resend when RESEND_FROM_EMAIL is missing", async () => {
    process.env.RESEND_API_KEY = "test-key";
    delete process.env.RESEND_FROM_EMAIL;

    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" });

    expect(result).toEqual({ sent: false, error: "Resend is not configured" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends the email and returns sent:true on success", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "noreply@example.com";
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" });

    expect(result).toEqual({ sent: true });
    expect(mockSend).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "a@b.com",
      subject: "Hi",
      html: "<p>Hi</p>",
    });
  });

  it("returns sent:false when Resend responds with an error", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "noreply@example.com";
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid recipient" } });

    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({ to: "bad", subject: "Hi", html: "<p>Hi</p>" });

    expect(result).toEqual({ sent: false, error: "Invalid recipient" });
  });

  it("returns sent:false when Resend throws unexpectedly", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "noreply@example.com";
    mockSend.mockRejectedValue(new Error("network down"));

    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" });

    expect(result).toEqual({ sent: false, error: "network down" });
  });
});
