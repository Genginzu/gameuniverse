"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";

/** Non-essential cookie categories that require prior consent. */
export interface ConsentCategories {
  analytics: boolean;
  media: boolean;
  marketing: boolean;
}

export interface CookieConsentValue {
  /** Whether the user has made an explicit choice yet. */
  decided: boolean;
  categories: ConsentCategories;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (categories: ConsentCategories) => void;
  openPreferences: () => void;
}

const COOKIE_NAME = "gu-cookie-consent";
/** 6 months, per CNIL guidance. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
/** Custom event to open the preferences panel from anywhere (e.g. footer link). */
export const OPEN_PREFERENCES_EVENT = "gu:open-cookie-preferences";

const DENIED: ConsentCategories = { analytics: false, media: false, marketing: false };

export const CookieConsentContext = createContext<CookieConsentValue | null>(null);

function readConsent(): ConsentCategories | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.split("=").slice(1).join("="));
    const parsed = JSON.parse(raw) as Partial<ConsentCategories>;
    return {
      analytics: Boolean(parsed.analytics),
      media: Boolean(parsed.media),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

function writeConsent(categories: ConsentCategories): void {
  const value = encodeURIComponent(JSON.stringify(categories));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [decided, setDecided] = useState(false);
  const [categories, setCategories] = useState<ConsentCategories>(DENIED);
  const [managerOpen, setManagerOpen] = useState(false);
  // The consent cookie is only readable on the client: until it has been read,
  // render no banner, so visitors who already chose never see it flash in the
  // server HTML (visible for a while on slow connections) before hydration.
  const [consentRead, setConsentRead] = useState(false);

  // Hydrate from the stored cookie on mount. Absence => banner shown.
  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setCategories(stored);
      setDecided(true);
    }
    setConsentRead(true);
  }, []);

  const persist = useCallback((next: ConsentCategories) => {
    writeConsent(next);
    setCategories(next);
    setDecided(true);
    setManagerOpen(false);
  }, []);

  const acceptAll = useCallback(
    () => persist({ analytics: true, media: true, marketing: true }),
    [persist]
  );
  const rejectAll = useCallback(() => persist(DENIED), [persist]);
  const openPreferences = useCallback(() => setManagerOpen(true), []);

  // Allow any component (footer "Manage cookies") to open the panel via event.
  useEffect(() => {
    const handler = () => setManagerOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, handler);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, handler);
  }, []);

  const value = useMemo<CookieConsentValue>(
    () => ({ decided, categories, acceptAll, rejectAll, save: persist, openPreferences }),
    [decided, categories, acceptAll, rejectAll, persist, openPreferences]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {consentRead && (
        <CookieConsentBanner
          managerOpen={managerOpen}
          onCloseManager={() => setManagerOpen(false)}
        />
      )}
    </CookieConsentContext.Provider>
  );
}
