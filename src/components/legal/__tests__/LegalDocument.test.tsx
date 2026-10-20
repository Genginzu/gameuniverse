import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next-intl", async (importOriginal) => importOriginal());

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

import { LegalDocument } from "@/components/legal/LegalDocument";

async function renderDocument(locale: string, page: Parameters<typeof LegalDocument>[0]["page"]) {
  return render(await LegalDocument({ locale, page }));
}

describe("LegalDocument", () => {
  it("renders the French legal notice with placeholders for missing publisher values", async () => {
    await renderDocument("fr", "mentionsLegales");
    expect(screen.getByRole("heading", { name: "Éditeur du site" })).toBeTruthy();
    expect(screen.getAllByText("[À COMPLÉTER]").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Téléphone/)).toBeNull();
  });

  it("renders the English version", async () => {
    await renderDocument("en", "mentionsLegales");
    expect(screen.getByRole("heading", { name: "Website publisher" })).toBeTruthy();
    expect(screen.getAllByText("[TO BE COMPLETED]").length).toBeGreaterThan(0);
  });

  it("exposes the consumer mediation anchor used by the footer", async () => {
    const { container } = await renderDocument("fr", "cgv");
    expect(container.querySelector("h2#mediation")?.textContent).toBe("7. Médiation de la consommation");
  });

  it("renders tables and locale-aware internal links", async () => {
    const { container } = await renderDocument("en", "cookies");
    expect(container.querySelectorAll("table")).toHaveLength(3);
    await renderDocument("en", "cgu");
    expect(screen.getAllByRole("link", { name: "legal notice" })[0].getAttribute("href")).toBe(
      "/mentions-legales",
    );
  });

  it("falls back to French for an unknown locale", async () => {
    await renderDocument("de", "cgu");
    expect(screen.getByRole("heading", { name: "1. Objet" })).toBeTruthy();
  });
});
