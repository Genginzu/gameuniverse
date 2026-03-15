import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// --- Mocks ---

const mockCollectionsReturn = {
  collections: [] as Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isPublic: boolean;
    gamesCount: number;
    updatedAt: string;
    coverImages: string[];
    coverImageUrl: string | null;
  }>,
  isLoading: false,
  error: null as string | null,
  refetch: vi.fn(),
};

const mockUseCollections = vi.fn(() => mockCollectionsReturn);
const mockCreateCollection = vi.fn();

vi.mock("@/hooks/useCollections", () => ({
  useCollections: (...args: unknown[]) => mockUseCollections(...args),
}));

vi.mock("@/hooks/useCollectionMutations", () => ({
  useCollectionMutations: () => ({ createCollection: mockCreateCollection }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "player-1" } }),
}));

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
    useLocale: () => "fr",
  };
});

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { src: props.src as string, alt: props.alt as string }),
}));

import { PlayerCollectionsFeed } from "@/components/players/PlayerCollectionsFeed";

const SAMPLE_COLLECTION = {
  id: "col-1",
  name: "RPG Favorites",
  slug: "rpg-favorites",
  description: "My favorite RPGs",
  isPublic: true,
  gamesCount: 12,
  updatedAt: "2024-03-01T12:00:00Z",
  coverImages: ["/covers/zelda.jpg"],
  coverImageUrl: null,
};

function setHookState(overrides: Partial<typeof mockCollectionsReturn>) {
  mockUseCollections.mockReturnValue({ ...mockCollectionsReturn, ...overrides });
}

describe("PlayerCollectionsFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCollections.mockReturnValue({ ...mockCollectionsReturn });
  });

  it("renders collections when data is available", () => {
    setHookState({ collections: [SAMPLE_COLLECTION] });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByText("RPG Favorites")).toBeInTheDocument();
  });

  it("shows empty state when no collections", () => {
    setHookState({ collections: [], isLoading: false });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("shows skeleton during initial loading", () => {
    setHookState({ isLoading: true });
    const { container } = render(
      <PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />
    );
    // Skeleton elements are rendered by PlayerCollectionsListView
    const skeletons = container.querySelectorAll("[class*='bg-gray-200'], [class*='bg-slate-700']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows create button when isOwner is true", () => {
    setHookState({ collections: [SAMPLE_COLLECTION] });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={true} />);
    expect(screen.getByText("createButton")).toBeInTheDocument();
  });

  it("hides create button when isOwner is false", () => {
    setHookState({ collections: [SAMPLE_COLLECTION] });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.queryByText("createButton")).not.toBeInTheDocument();
  });

  it("renders responsive grid with correct CSS classes", () => {
    setHookState({ collections: [SAMPLE_COLLECTION] });
    const { container } = render(
      <PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />
    );
    const grid = container.querySelector(".grid-cols-2");
    expect(grid).toBeInTheDocument();
  });

  it("shows error message when error occurs", () => {
    setHookState({ error: "Network error" });
    render(<PlayerCollectionsFeed playerId="player-1" locale="fr" isOwner={false} />);
    expect(screen.getByText("error")).toBeInTheDocument();
  });
});
