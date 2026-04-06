import { describe, it, expect, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
  useMessages: () => ({}),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "fr" }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

import * as ComponentModule from "@/components/admin/games/GameFormImagesTab";

describe("GameFormImagesTab", () => {
  it("module is importable", () => {
    expect(ComponentModule).toBeDefined();
    expect(Object.keys(ComponentModule).length).toBeGreaterThan(0);
  });
});
