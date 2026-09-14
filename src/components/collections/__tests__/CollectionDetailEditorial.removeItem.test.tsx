import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import type { CollectionDetail, CollectionItem } from "@/types/collection";

// ---------------------------------------------------------------------------
// next-intl : renvoie `namespace.key` (+ params) pour des assertions simples
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, params?: Record<string, string | number>) => {
      let value = `${namespace}.${key}`;
      if (params) {
        const paramsStr = Object.entries(params)
          .map(([k, v]) => `${k}=${v}`)
          .join("|");
        value = `${value}|${paramsStr}`;
      }
      return value;
    },
}));

// ---------------------------------------------------------------------------
// i18n navigation
// ---------------------------------------------------------------------------

const pushMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...rest }, children),
  useRouter: () => ({ push: pushMock }),
}));

// ---------------------------------------------------------------------------
// Iconify + LazyImage stubs
// ---------------------------------------------------------------------------

vi.mock("@iconify/react", () => ({
  Icon: ({ icon }: { icon: string }) =>
    React.createElement("span", { "data-testid": "icon", "data-icon": icon }),
}));

vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: ({ src, alt }: { src?: string; alt?: string }) =>
    React.createElement("img", { src, alt, "data-testid": "lazy-image" }),
}));

// ---------------------------------------------------------------------------
// Heavy children non liés au flow de suppression
// ---------------------------------------------------------------------------

vi.mock("@/components/collections/CollectionDetailHero", () => ({
  CollectionDetailHero: () => React.createElement("div", { "data-testid": "hero" }),
}));

vi.mock("@/components/collections/EditItemNoteDialog", () => ({
  EditItemNoteDialog: () => null,
}));

vi.mock("@/components/collections/CollectionForm", () => ({
  CollectionForm: () => null,
}));

vi.mock("@/components/collections/AddGameToCollection", () => ({
  AddGameToCollection: () => null,
}));

// ---------------------------------------------------------------------------
// Auth + data hooks
// ---------------------------------------------------------------------------

const OWNER_ID = "user-1";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: OWNER_ID }, loading: false }),
}));

const refetchMock = vi.fn(async () => {});

function makeItem(overrides: Partial<CollectionItem> = {}): CollectionItem {
  return {
    id: "ci-1",
    gameId: "g-1",
    slug: "zelda",
    title: "The Legend of Zelda",
    coverImage: "/zelda.jpg",
    genres: [],
    note: null,
    position: 1,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCollection(overrides: Partial<CollectionDetail> = {}): CollectionDetail {
  return {
    id: "col-1",
    userId: OWNER_ID,
    name: "My Collection",
    slug: "my-collection",
    description: null,
    isPublic: true,
    coverImageUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    owner: { id: OWNER_ID, fullName: "Owner", avatarUrl: null },
    items: [makeItem()],
    ...overrides,
  };
}

let collectionValue: CollectionDetail;

vi.mock("@/hooks/useCollectionDetail", () => ({
  useCollectionDetail: () => ({
    collection: collectionValue,
    isLoading: false,
    error: null,
    notFound: false,
    refetch: refetchMock,
  }),
}));

const removeItemMock = vi.fn(async () => {});

vi.mock("@/hooks/useCollectionMutations", () => ({
  useCollectionMutations: () => ({
    updateCollection: vi.fn(),
    deleteCollection: vi.fn(),
    toggleVisibility: vi.fn(),
    addItem: vi.fn(),
    removeItem: removeItemMock,
    updateItemNote: vi.fn(),
    reorderItems: vi.fn(),
  }),
}));

const toastMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (args: unknown) => toastMock(args),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { CollectionDetailEditorial } from "@/components/collections/CollectionDetailEditorial";

function getRemoveButton(): HTMLElement {
  return screen
    .getAllByRole("button")
    .find((b) => b.getAttribute("aria-label")?.includes("removeItem.ariaLabel"))!;
}

function getConfirmButton(): HTMLElement {
  return screen
    .getAllByRole("button")
    .find((b) => b.textContent?.includes("removeItem.confirmAction"))!;
}

describe("CollectionDetailEditorial — remove item flow", () => {
  beforeEach(() => {
    collectionValue = makeCollection();
    removeItemMock.mockReset();
    removeItemMock.mockResolvedValue(undefined);
    toastMock.mockReset();
    refetchMock.mockClear();
  });

  it("click → confirm → calls removeItem with (slug, gameId) and shows success toast", async () => {
    render(<CollectionDetailEditorial slug="my-collection" locale="fr" />);

    fireEvent.click(getRemoveButton());

    // Confirm dialog visible with interpolated game title
    expect(
      screen.getByText(/removeItem\.confirmDescription\|title=The Legend of Zelda/)
    ).toBeTruthy();

    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(removeItemMock).toHaveBeenCalledWith("my-collection", "g-1");
    });

    expect(toastMock).toHaveBeenCalledWith({
      title: "collections.editorial.detail.removeItem.successToast",
    });
  });

  it("keeps the dialog open and shows a destructive toast on error", async () => {
    removeItemMock.mockRejectedValueOnce(new Error("boom"));

    render(<CollectionDetailEditorial slug="my-collection" locale="fr" />);

    fireEvent.click(getRemoveButton());
    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        title: "collections.editorial.detail.removeItem.errorToast",
        variant: "destructive",
      });
    });

    // Dialog still open (confirm action button still present)
    expect(getConfirmButton()).toBeTruthy();
  });
});
