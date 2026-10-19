"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type RecoveryProof =
  | { kind: "tokenHash"; tokenHash: string }
  | { kind: "tokens"; accessToken: string; refreshToken: string }
  | { kind: "session" };

export type RecoveryLinkStatus = "loading" | "ready" | "missing";

export function readRecoveryProof(hash: string, search: string): RecoveryProof | null {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (accessToken && refreshToken && hashParams.get("type") === "recovery") {
    return { kind: "tokens", accessToken, refreshToken };
  }

  const queryParams = new URLSearchParams(search);
  const tokenHash = queryParams.get("token_hash");
  if (tokenHash && queryParams.get("type") === "recovery") {
    return { kind: "tokenHash", tokenHash };
  }
  return null;
}

/**
 * Reads a password-recovery link WITHOUT signing in. The session is only
 * established when the user submits the new password (`establishSession`), so
 * opening a recovery link someone else forwarded never logs this browser into
 * their account.
 */
export function usePasswordRecoveryLink(auth: SupabaseClient["auth"]) {
  const [status, setStatus] = useState<RecoveryLinkStatus>("loading");
  const proofRef = useRef<RecoveryProof | null>(null);

  useEffect(() => {
    const proof = readRecoveryProof(window.location.hash, window.location.search);
    if (proof) {
      proofRef.current = proof;
      setStatus("ready");
      return;
    }

    auth.getSession().then(({ data }) => {
      if (data.session) {
        proofRef.current = { kind: "session" };
        setStatus("ready");
      } else {
        setStatus("missing");
      }
    });
  }, [auth]);

  /** Returns an error message, or null once the recovery session is active. */
  const establishSession = useCallback(async (): Promise<string | null> => {
    const proof = proofRef.current;
    if (!proof) return "Missing recovery link";
    if (proof.kind === "session") return null;

    const { error } =
      proof.kind === "tokenHash"
        ? await auth.verifyOtp({ token_hash: proof.tokenHash, type: "recovery" })
        : await auth.setSession({
            access_token: proof.accessToken,
            refresh_token: proof.refreshToken,
          });
    if (error) return error.message;

    proofRef.current = { kind: "session" };
    window.history.replaceState(null, "", window.location.pathname);
    return null;
  }, [auth]);

  return { status, establishSession };
}
