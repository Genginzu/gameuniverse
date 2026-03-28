import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import MessageBubble from "@/components/discussions/MessageBubble";
import type { Message } from "@/types/discussion";

vi.mock("@/lib/utils/discussion-utils", () => ({
  formatMessageDate: () => "12/03/2024",
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

describe("MessageBubble", () => {
  it("renders own message aligned right with correct testid", () => {
    render(<MessageBubble message={makeMessage()} isOwn={true} />);

    const bubble = screen.getByTestId("message-bubble");
    expect(bubble.className).toContain("justify-end");

    expect(screen.getByTestId("message-own")).toBeInTheDocument();
    expect(screen.queryByTestId("message-received")).not.toBeInTheDocument();
  });

  it("renders received message aligned left with correct testid", () => {
    render(<MessageBubble message={makeMessage()} isOwn={false} />);

    const bubble = screen.getByTestId("message-bubble");
    expect(bubble.className).toContain("justify-start");

    expect(screen.getByTestId("message-received")).toBeInTheDocument();
    expect(screen.queryByTestId("message-own")).not.toBeInTheDocument();
  });

  it("displays message content", () => {
    render(<MessageBubble message={makeMessage({ content: "Test content here" })} isOwn={false} />);
    expect(screen.getByText("Test content here")).toBeInTheDocument();
  });

  it("displays formatted timestamp", () => {
    render(<MessageBubble message={makeMessage()} isOwn={false} />);
    expect(screen.getByText("12/03/2024")).toBeInTheDocument();
  });

  /**
   * Feature: player-discussions, Property 9: Message alignment depends on sender
   *
   * _For any_ message and current user ID, the message should be aligned right
   * if senderId === currentUserId, and aligned left otherwise.
   *
   * **Validates: Requirements 4.3**
   */
  describe("Property 9: Message alignment depends on sender", () => {
    const uuidArb = fc.uuid().map((u) => u.toString());

    it("aligns right (justify-end) when senderId equals currentUserId", () => {
      fc.assert(
        fc.property(uuidArb, fc.string({ minLength: 1, maxLength: 200 }), (userId, content) => {
          const msg = makeMessage({ senderId: userId, content });
          const { unmount } = render(<MessageBubble message={msg} isOwn={true} />);

          const bubble = screen.getByTestId("message-bubble");
          expect(bubble.className).toContain("justify-end");
          expect(screen.getByTestId("message-own")).toBeInTheDocument();

          unmount();
          cleanup();
        }),
        { numRuns: 100 }
      );
    });

    it("aligns left (justify-start) when senderId differs from currentUserId", () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          fc.string({ minLength: 1, maxLength: 200 }),
          (senderId, otherUserId, content) => {
            fc.pre(senderId !== otherUserId);
            const msg = makeMessage({ senderId, content });
            const { unmount } = render(<MessageBubble message={msg} isOwn={false} />);

            const bubble = screen.getByTestId("message-bubble");
            expect(bubble.className).toContain("justify-start");
            expect(screen.getByTestId("message-received")).toBeInTheDocument();

            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
