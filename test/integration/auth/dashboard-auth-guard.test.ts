import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import DashboardPage from "@/app/[locale]/dashboard/page";

const mocks = vi.hoisted(() => ({
  user: null as Record<string, unknown> | null,
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user } }) },
  }),
}));
vi.mock("@/components/layout/editorial/EditorialShell", () => ({ EditorialShell: () => null }));
vi.mock("@/components/dashboard/DashboardEditorial", () => ({ DashboardEditorial: () => null }));

type DashboardUserProp = { id: string; email: string; username: string; createdAt: string };

async function renderPage(locale: string) {
  const element = (await DashboardPage({ params: Promise.resolve({ locale }) })) as ReactElement<{
    children: ReactElement<{ user: DashboardUserProp }>;
  }>;
  return element.props.children.props.user;
}

describe("DashboardPage auth guard", () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.redirect.mockClear();
  });

  it.each(["fr", "en"])("redirects anonymous visitors to /%s/auth", async (locale) => {
    await expect(renderPage(locale)).rejects.toThrow(`NEXT_REDIRECT:/${locale}/auth`);
    expect(mocks.redirect).toHaveBeenCalledWith(`/${locale}/auth`);
  });

  it("renders the dashboard with the username from metadata", async () => {
    mocks.user = {
      id: "user-1",
      email: "player@example.com",
      created_at: "2025-01-01T00:00:00Z",
      user_metadata: { username: "Player One" },
    };
    expect(await renderPage("fr")).toEqual({
      id: "user-1",
      email: "player@example.com",
      username: "Player One",
      createdAt: "2025-01-01T00:00:00Z",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("falls back to the email local part when no username is set", async () => {
    mocks.user = { id: "user-1", email: "player@example.com", created_at: "", user_metadata: {} };
    expect((await renderPage("fr")).username).toBe("player");
  });
});
