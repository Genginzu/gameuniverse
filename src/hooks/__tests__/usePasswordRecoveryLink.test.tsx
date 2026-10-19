import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { readRecoveryProof, usePasswordRecoveryLink } from "@/hooks/usePasswordRecoveryLink";

function createAuth(session: unknown = null) {
  return {
    getSession: vi.fn().mockResolvedValue({ data: { session } }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    setSession: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe("readRecoveryProof", () => {
  it("reads a token hash or implicit tokens of a recovery link only", () => {
    expect(readRecoveryProof("", "?token_hash=h&type=recovery")).toEqual({
      kind: "tokenHash",
      tokenHash: "h",
    });
    expect(readRecoveryProof("#access_token=a&refresh_token=r&type=recovery", "")).toEqual({
      kind: "tokens",
      accessToken: "a",
      refreshToken: "r",
    });
    expect(readRecoveryProof("", "?token_hash=h&type=signup")).toBeNull();
  });
});

describe("usePasswordRecoveryLink", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/fr/auth/reset-password?token_hash=h&type=recovery");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("does not sign in when the link is opened, only on establishSession", async () => {
    const auth = createAuth();
    const { result } = renderHook(() => usePasswordRecoveryLink(auth as never));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(auth.verifyOtp).not.toHaveBeenCalled();

    let error: string | null = "pending";
    await act(async () => {
      error = await result.current.establishSession();
    });

    expect(error).toBeNull();
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "h", type: "recovery" });
    expect(window.location.search).toBe("");
  });

  it("reports an expired link at submit time", async () => {
    const auth = createAuth();
    auth.verifyOtp.mockResolvedValue({ error: { message: "Token has expired" } });
    const { result } = renderHook(() => usePasswordRecoveryLink(auth as never));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    let error: string | null = null;
    await act(async () => {
      error = await result.current.establishSession();
    });

    expect(error).toBe("Token has expired");
  });

  it("is missing without a link nor an existing session", async () => {
    window.history.replaceState(null, "", "/fr/auth/reset-password");
    const auth = createAuth(null);
    const { result } = renderHook(() => usePasswordRecoveryLink(auth as never));

    await waitFor(() => expect(result.current.status).toBe("missing"));
  });
});
