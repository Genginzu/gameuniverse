import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConversationList from "@/components/discussions/ConversationList";
import type { ConversationSummary } from "@/types/discussion";

// Mock next-intl — return key as text
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock lucide-react icons used by ConversationList
vi.mock("lucide-react", () => ({
  Plus: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...props, "data-testid": "plus-icon" }),
  MessageSquare: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...props, "data-testid": "message-square-icon" }),
  Loader2: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement("svg", { ...props, "data-testid": "loader-icon" }),
}));

// Mock ConversationItem — render a simplified button with conversation data
vi.mock("@/components/discussions/ConversationItem", () => ({
  default: ({
    conversation,
    isSelected,
    onSelect,
  }: {
    conversation: ConversationSummary;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) =>
    React.createElement(
      "button",
      {
        "data-testid": `conversation-item-${conversation.id}`,
        "data-selected": isSelected,
        onClick: () => onSelect(conversation.id),
      },
      conversation.friend.displayName
    ),
}));

function makeConversation(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: "conv-1",
    friend: { id: "friend-1", displayName: "Alice", avatarUrl: null },
    lastMessage: {
      content: "Hello!",
      senderId: "friend-1",
      createdAt: "2024-03-12T10:00:00Z",
    },
    unreadCount: 0,
    ...overrides,
  };
}

describe("ConversationList", () => {
  const defaultProps = {
    conversations: [] as ConversationSummary[],
    selectedId: null as string | null,
    onSelect: vi.fn(),
    onNewConversation: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the conversation list container", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("renders one ConversationItem per conversation", () => {
    const conversations = [
      makeConversation({
        id: "conv-1",
        friend: { id: "f1", displayName: "Alice", avatarUrl: null },
      }),
      makeConversation({ id: "conv-2", friend: { id: "f2", displayName: "Bob", avatarUrl: null } }),
      makeConversation({
        id: "conv-3",
        friend: { id: "f3", displayName: "Charlie", avatarUrl: null },
      }),
    ];

    render(<ConversationList {...defaultProps} conversations={conversations} />);

    expect(screen.getByTestId("conversation-item-conv-1")).toBeInTheDocument();
    expect(screen.getByTestId("conversation-item-conv-2")).toBeInTheDocument();
    expect(screen.getByTestId("conversation-item-conv-3")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("shows empty state when no conversations exist", () => {
    render(<ConversationList {...defaultProps} conversations={[]} />);

    expect(screen.getByTestId("message-square-icon")).toBeInTheDocument();
    expect(screen.getByText("noConversations")).toBeInTheDocument();
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<ConversationList {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    // Empty state should not be visible during loading
    expect(screen.queryByText("noConversations")).not.toBeInTheDocument();
  });

  it("calls onNewConversation when new conversation button is clicked", () => {
    const onNewConversation = vi.fn();
    render(<ConversationList {...defaultProps} onNewConversation={onNewConversation} />);

    fireEvent.click(screen.getByTestId("new-conversation-button"));
    expect(onNewConversation).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect with conversation id when a conversation is clicked", () => {
    const onSelect = vi.fn();
    const conversations = [
      makeConversation({
        id: "conv-42",
        friend: { id: "f1", displayName: "Alice", avatarUrl: null },
      }),
    ];

    render(
      <ConversationList {...defaultProps} conversations={conversations} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByTestId("conversation-item-conv-42"));
    expect(onSelect).toHaveBeenCalledWith("conv-42");
  });

  it("passes isSelected=true to the selected conversation item", () => {
    const conversations = [
      makeConversation({
        id: "conv-1",
        friend: { id: "f1", displayName: "Alice", avatarUrl: null },
      }),
      makeConversation({ id: "conv-2", friend: { id: "f2", displayName: "Bob", avatarUrl: null } }),
    ];

    render(
      <ConversationList {...defaultProps} conversations={conversations} selectedId="conv-2" />
    );

    expect(screen.getByTestId("conversation-item-conv-1").getAttribute("data-selected")).toBe(
      "false"
    );
    expect(screen.getByTestId("conversation-item-conv-2").getAttribute("data-selected")).toBe(
      "true"
    );
  });

  it("does not show empty state or spinner when conversations are present", () => {
    const conversations = [makeConversation()];
    render(<ConversationList {...defaultProps} conversations={conversations} />);

    expect(screen.queryByText("noConversations")).not.toBeInTheDocument();
    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
  });
});
