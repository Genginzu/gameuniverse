import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";

import { CookieConsentProvider } from "@/components/providers/CookieConsentProvider";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

const CONSENT_COOKIE = "gu-cookie-consent";

function setConsentCookie(value: string | null) {
  document.cookie = value
    ? `${CONSENT_COOKIE}=${encodeURIComponent(value)}; path=/`
    : `${CONSENT_COOKIE}=; path=/; max-age=0`;
}

function page() {
  return (
    <CookieConsentProvider>
      <p>page</p>
    </CookieConsentProvider>
  );
}

describe("CookieConsentProvider", () => {
  afterEach(() => setConsentCookie(null));

  it("leaves the banner out of the server HTML, before the consent cookie can be read", () => {
    const html = renderToString(page());

    expect(html).toContain("page");
    expect(html).not.toContain("acceptAll");
  });

  it("shows the banner once it knows no choice was stored", () => {
    render(page());

    expect(screen.getByRole("dialog", { name: "title" })).toBeInTheDocument();
  });

  it("never shows the banner when a choice was already stored", () => {
    setConsentCookie(JSON.stringify({ analytics: true, media: false, marketing: false }));
    render(page());

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
