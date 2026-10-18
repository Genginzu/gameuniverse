import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GameDetails, GamePricing } from "@/types/game";

vi.mock("next-intl", () => {
  const t = Object.assign((key: string) => key, { rich: (key: string) => key });
  return { useTranslations: () => t };
});
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/shared/SpotlightCard", () => ({
  SpotlightCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { PricingSection } = await import("../sections/PricingSection");

function price(overrides: Partial<GamePricing>): GamePricing {
  return {
    id: "p1",
    price: 10,
    currency: "EUR",
    platform: "PC",
    lastUpdated: "",
    storeUrl: "https://store.steampowered.com/app/1",
    isAffiliate: false,
    store: { name: "Steam" },
    ...overrides,
  };
}

function renderSection(pricing: GamePricing[]) {
  const game = { pricing } as unknown as GameDetails;
  return render(<PricingSection game={game} formatPrice={(value) => `${value} €`} />);
}

describe("PricingSection affiliation", () => {
  it("keeps raw links and hides the disclosure when no store is affiliated", () => {
    renderSection([price({})]);
    const link = screen.getByRole("link", { name: /review.buy/ });
    expect(link.getAttribute("href")).toBe("https://store.steampowered.com/app/1");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.queryByText("disclosure")).toBeNull();
  });

  it("routes affiliated stores through /api/go and shows the disclosure", () => {
    renderSection([
      price({ id: "p-amazon", isAffiliate: true, store: { name: "Amazon" }, price: 5 }),
      price({ id: "p-steam" }),
    ]);
    const links = screen.getAllByRole("link", { name: /review.buy/ });
    expect(links[0].getAttribute("href")).toBe("/api/go?price=p-amazon");
    expect(links[0].getAttribute("rel")).toBe("sponsored nofollow noopener noreferrer");
    expect(links[0].getAttribute("target")).toBe("_blank");
    expect(links[1].getAttribute("href")).toBe("https://store.steampowered.com/app/1");
    expect(screen.getByText("disclosure")).toBeTruthy();
    expect(screen.getByRole("link", { name: "learnMore" }).getAttribute("href")).toBe(
      "/mentions-legales#affiliation"
    );
  });
});
