"use client";

import { useContext } from "react";
import {
  CookieConsentContext,
  type CookieConsentValue,
} from "@/components/providers/CookieConsentProvider";

/**
 * Access the cookie-consent state and actions.
 * Must be used within a `CookieConsentProvider`.
 */
export function useCookieConsent(): CookieConsentValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return ctx;
}
