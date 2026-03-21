import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

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

import { PostCard } from "@/components/players/posts/PostCard";

const SAMPLE_POST = {
  id: "post-1",
  playerId: "player-1",
  content: "Hello world, this is my first post!",
  imageUrl: null,
  tags: [] as string[],
  mentions: [] as Array<{ playerId: string; username: string }>,
  createdAt: "2024-03-10T12:00:00Z",
  updatedAt: "2024-03-10T12:00:00Z",
};

describe("PostCard", () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnDelete.mockResolvedValue(undefined);
  });

  // Req 6.2 — renders post content text
  it("renders post content", () => {
    render(<PostCard post={SAMPLE_POST} locale="fr" isOwner={false} onDelete={mockOnDelete} />);
    expect(screen.getByText("Hello world, this is my first post!")).toBeInTheDocument();
  });

  // Req 6.2 — renders relative date via useFormatter
  it("renders relative date", () => {
    render(<PostCard post={SAMPLE_POST} locale="fr" isOwner={false} onDelete={mockOnDelete} />);
    expect(screen.getByText("il y a 2 heures")).toBeInTheDocument();
  });

  // Req 8.1 — delete button visible when isOwner=true
  it("shows delete button when isOwner is true", () => {
    render(<PostCard post={SAMPLE_POST} locale="fr" isOwner={true} onDelete={mockOnDelete} />);
    expect(screen.getByLabelText("deleteLabel")).toBeInTheDocument();
  });

  // Req 8.5 — delete button hidden when isOwner=false
  it("hides delete button when isOwner is false", () => {
    render(<PostCard post={SAMPLE_POST} locale="fr" isOwner={false} onDelete={mockOnDelete} />);
    expect(screen.queryByLabelText("deleteLabel")).not.toBeInTheDocument();
  });

  // Req 8.2 — clicking delete shows confirmation
  it("shows confirmation on delete click", () => {
    render(<PostCard post={SAMPLE_POST} locale="fr" isOwner={true} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText("deleteLabel"));
    expect(screen.getByText("deleteCancel")).toBeInTheDocument();
    expect(screen.getByText("deleteConfirm")).toBeInTheDocument();
  });

  // Req 8.2 — clicking cancel hides confirmation
  it("hides confirmation on cancel click", () => {
    render(<PostCard post={SAMPLE_POST} locale="fr" isOwner={true} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText("deleteLabel"));
    fireEvent.click(screen.getByText("deleteCancel"));
    // Confirmation gone, delete button back
    expect(screen.queryByText("deleteCancel")).not.toBeInTheDocument();
    expect(screen.getByLabelText("deleteLabel")).toBeInTheDocument();
  });

  // Req 8.3 — confirming deletion calls onDelete with post.id
  it("calls onDelete with post id on confirm", async () => {
    render(<PostCard post={SAMPLE_POST} locale="fr" isOwner={true} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText("deleteLabel"));
    fireEvent.click(screen.getByText("deleteConfirm"));

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith("post-1");
    });
  });
});
