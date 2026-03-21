import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageThread from "@/components/discussions/MessageThread";
import type { Message } from "@/types/discussion";

// Mock next-intl — return key as text
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock @iconify/react icons used by MessageThread
vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) =>
    React.createElement("svg", { ...props, "data-testid": `icon-${props.icon}` }),
}));

// Track props passed to each MessageBubble for assertion
const messageBubbleRenders: { messageId: string; isOwn: boolean }[] = [];

vi.mock("@/components/discussions/MessageBubble", () => ({
  default: ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
    messageBubbleRenders.push({ messageId: message.id, isOwn });
    return React.createElement(
      "div",
      {
        "data-testid": `message-bubble-${message.id}`,
        "data-is-own": isOwn,
      },
      message.content
    );
  },
}));

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-sender",
    content: "Hello world",
    createdAt: "2024-03-12T10:00:00Z",
    readAt: null,
    ...overrides,
  };
}

describe("MessageThread", () => {
  const currentUserId = "current-user";

  const defaultProps = {
    messages: [] as Message[],
    currentUserId,
    isLoading: false,
    hasMore: false,
    onLoadMore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    messageBubbleRenders.length = 0;
  });

  it("renders the message thread container", () => {
    render(<MessageThread {...defaultProps} />);
    expect(screen.getByTestId("message-thread")).toBeInTheDocument();
  });

  it("renders one MessageBubble per message", () => {
    const messages = [
      makeMessage({ id: "msg-1", content: "First" }),
      makeMessage({ id: "msg-2", content: "Second" }),
      makeMessage({ id: "msg-3", content: "Third" }),
    ];

    render(<MessageThread {...defaultProps} messages={messages} />);

    expect(screen.getByTestId("message-bubble-msg-1")).toBeInTheDocument();
    expect(screen.getByTestId("message-bubble-msg-2")).toBeInTheDocument();
    expect(screen.getByTestId("message-bubble-msg-3")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("shows load more button when hasMore is true", () => {
    render(<MessageThread {...defaultProps} hasMore={true} />);
    expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
  });

  it("does not show load more button when hasMore is false", () => {
    render(<MessageThread {...defaultProps} hasMore={false} />);
    expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
  });

  it("calls onLoadMore when load more button is clicked", () => {
    const onLoadMore = vi.fn();
    render(<MessageThread {...defaultProps} hasMore={true} onLoadMore={onLoadMore} />);

    fireEvent.click(screen.getByTestId("load-more-button"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("disables load more button when isLoading is true", () => {
    render(<MessageThread {...defaultProps} hasMore={true} isLoading={true} />);

    const button = screen.getByTestId("load-more-button");
    expect(button).toBeDisabled();
  });

  it("shows loading spinner when isLoading and no messages", () => {
    render(<MessageThread {...defaultProps} isLoading={true} messages={[]} />);
    // The loader icon appears in the empty loading state
    const loaders = screen.getAllByTestId("icon-lucide:loader-2");
    expect(loaders.length).toBeGreaterThanOrEqual(1);
  });

  it("passes isOwn=true for messages sent by currentUserId", () => {
    const messages = [
      makeMessage({ id: "msg-own", senderId: currentUserId, content: "My message" }),
    ];

    render(<MessageThread {...defaultProps} messages={messages} />);

    const bubble = screen.getByTestId("message-bubble-msg-own");
    expect(bubble.getAttribute("data-is-own")).toBe("true");
    expect(messageBubbleRenders).toContainEqual({ messageId: "msg-own", isOwn: true });
  });

  it("passes isOwn=false for messages sent by other users", () => {
    const messages = [
      makeMessage({ id: "msg-other", senderId: "other-user", content: "Their message" }),
    ];

    render(<MessageThread {...defaultProps} messages={messages} />);

    const bubble = screen.getByTestId("message-bubble-msg-other");
    expect(bubble.getAttribute("data-is-own")).toBe("false");
    expect(messageBubbleRenders).toContainEqual({ messageId: "msg-other", isOwn: false });
  });

  it("correctly distinguishes own and received messages in a mixed thread", () => {
    const messages = [
      makeMessage({ id: "msg-1", senderId: currentUserId, content: "Hello" }),
      makeMessage({ id: "msg-2", senderId: "friend-1", content: "Hi there" }),
      makeMessage({ id: "msg-3", senderId: currentUserId, content: "How are you?" }),
    ];

    render(<MessageThread {...defaultProps} messages={messages} />);

    expect(messageBubbleRenders).toContainEqual({ messageId: "msg-1", isOwn: true });
    expect(messageBubbleRenders).toContainEqual({ messageId: "msg-2", isOwn: false });
    expect(messageBubbleRenders).toContainEqual({ messageId: "msg-3", isOwn: true });
  });
});
