"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

import { AUTH_HINT_ATTRIBUTE, hasAuthCookie } from "@/lib/utils/authHint";

const noopSubscribe = () => () => {};
const readClientHint = () => hasAuthCookie(document.cookie);
const readServerHint = () => false;

/**
 * Returns `true` when a Supabase session cookie is present.
 *
 * Hydration uses the server snapshot (`false`) so markup matches the ISR HTML,
 * then re-renders with the real value. The `<html>` attribute set by the inline
 * script is kept in sync so a stale hint (after sign-out) never hides the landing.
 */
export function useAuthCookieHint(): boolean {
  const hinted = useSyncExternalStore(noopSubscribe, readClientHint, readServerHint);

  useLayoutEffect(() => {
    // Read the cookie directly: during hydration `hinted` is still the server value.
    document.documentElement.toggleAttribute(AUTH_HINT_ATTRIBUTE, readClientHint());
  }, [hinted]);

  return hinted;
}
