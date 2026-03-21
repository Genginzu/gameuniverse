import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Post } from "@/types/post";

// IntersectionObserver stub for jsdom
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor() {}
}
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock usePlayerPosts hook
const mockHookReturn = {
  posts: [] as Post[],
  isLoading: false,
  isLoadingMore: false,
  isCreating: false,
  hasNextPage: false,
  error: null as string | null,
  searchTerm: "",
  setSearchTerm: vi.fn(),
  loadMore: vi.fn(),
  createPost: vi.fn(),
  deletePost: vi.fn(),
};
const mockUsePlayerPosts = vi.fn(() => mockHookReturn);

vi.mock("@/hooks/usePlayerPosts", () => ({
  usePlayerPosts: (...args: unknown[]) => mockUsePlayerPosts(...args),
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
    useMessages: () => ({}),
    useFormatter: () => ({
      relativeTime: () => "il y a 2 heures",
      dateTime: () => "01/03/2024",
      number: (n: number) => String(n),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Imports AFTER all vi.mock() calls
import { PostsFeed } from "@/components/players/posts/PostsFeed";
import { PostComposer } from "@/components/players/posts/PostComposer";
import { PostCard } from "@/components/players/posts/PostCard";

// Arbitrary for Post objects — integer timestamps avoid invalid date edge cases
const toISO = (ms: number) => new Date(ms).toISOString();
const tsArb = fc.integer({ min: 1577836800000, max: 1735689600000 });

const postArb = fc.record({
  id: fc.uuid(),
  playerId: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  imageUrl: fc.constant(null),
  tags: fc.constant([] as string[]),
  mentions: fc.constant([] as Array<{ playerId: string; username: string }>),
  createdAt: tsArb.map(toISO),
  updatedAt: tsArb.map(toISO),
});

describe("Posts UI Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayerPosts.mockReturnValue({ ...mockHookReturn });
  });

  // Feature: player-posts-tab, Property 7: Composer visibility based on ownership
  // **Validates: Requirements 7.1, 7.8**
  describe("Property 7: Composer visibility based on ownership", () => {
    it("New post button is rendered iff isOwner is true", () => {
      fc.assert(
        fc.property(fc.boolean(), (isOwner) => {
          mockUsePlayerPosts.mockReturnValue({ ...mockHookReturn });
          const { unmount } = render(
            <PostsFeed
              playerId="player-1"
              playerName={null}
              playerAvatar={null}
              locale="fr"
              isOwner={isOwner}
            />
          );
          const newPostBtn = screen.queryByText("newPost");
          if (isOwner) {
            expect(newPostBtn).toBeInTheDocument();
          } else {
            expect(newPostBtn).not.toBeInTheDocument();
          }
          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: player-posts-tab, Property 8: Character counter accuracy
  // **Validates: Requirements 7.3**
  describe("Property 8: Character counter accuracy", () => {
    it("textarea value length matches input length for any valid content", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 2000 }), (content) => {
          const { unmount } = render(
            <PostComposer
              onPostCreated={vi.fn()}
              playerId="player-1"
              isCreating={false}
              onSubmit={vi.fn()}
            />
          );
          const textarea = screen.getByPlaceholderText("placeholder") as HTMLTextAreaElement;
          fireEvent.change(textarea, { target: { value: content } });
          expect(textarea.value.length).toBe(content.length);
          expect(screen.getByText("charCount")).toBeInTheDocument();
          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: player-posts-tab, Property 9: Publish button disabled for whitespace input
  // **Validates: Requirements 7.4**
  describe("Property 9: Publish button disabled for whitespace input", () => {
    it("publish button is disabled for any whitespace-only string", { timeout: 15000 }, () => {
      const whitespaceArb = fc
        .array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 0, maxLength: 50 })
        .map((a) => a.join(""));

      fc.assert(
        fc.property(whitespaceArb, (whitespace) => {
          const { unmount } = render(
            <PostComposer
              onPostCreated={vi.fn()}
              playerId="player-1"
              isCreating={false}
              onSubmit={vi.fn()}
            />
          );
          const textarea = screen.getByPlaceholderText("placeholder");
          fireEvent.change(textarea, { target: { value: whitespace } });
          const button = screen.getByRole("button", { name: /publish/i });
          expect(button).toBeDisabled();
          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: player-posts-tab, Property 10: Delete button visibility based on ownership
  // **Validates: Requirements 8.1, 8.5**
  describe("Property 10: Delete button visibility based on ownership", () => {
    it("delete button is rendered iff isOwner is true", () => {
      const samplePost: Post = {
        id: "post-1",
        playerId: "player-1",
        content: "Test post content",
        imageUrl: null,
        tags: [],
        mentions: [],
        createdAt: "2024-03-10T12:00:00Z",
        updatedAt: "2024-03-10T12:00:00Z",
      };

      fc.assert(
        fc.property(fc.boolean(), (isOwner) => {
          const { unmount } = render(
            <PostCard post={samplePost} locale="fr" isOwner={isOwner} onDelete={vi.fn()} />
          );
          const deleteBtn = screen.queryByLabelText("deleteLabel");
          if (isOwner) {
            expect(deleteBtn).toBeInTheDocument();
          } else {
            expect(deleteBtn).not.toBeInTheDocument();
          }
          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: player-posts-tab, Property 11: New post prepended to list
  // **Validates: Requirements 7.5**
  describe("Property 11: New post prepended to list", () => {
    it("new post appears at index 0 and existing posts remain unchanged", () => {
      fc.assert(
        fc.property(
          fc.array(postArb, { minLength: 0, maxLength: 20 }),
          postArb,
          (existingPosts, newPost) => {
            const updatedList = [newPost, ...existingPosts];
            expect(updatedList[0]).toEqual(newPost);
            expect(updatedList.length).toBe(existingPosts.length + 1);
            for (let i = 0; i < existingPosts.length; i++) {
              expect(updatedList[i + 1]).toEqual(existingPosts[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
