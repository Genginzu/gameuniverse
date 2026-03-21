import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MessageInput from "@/components/discussions/MessageInput";

vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) =>
    React.createElement("svg", { ...props, "data-testid": `icon-${props.icon}` }),
}));

describe("MessageInput", () => {
  let onSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSend = vi.fn().mockResolvedValue(undefined);
  });

  it("shows error and does not call onSend when input is empty", async () => {
    render(<MessageInput onSend={onSend} isSending={false} maxLength={2000} />);

    fireEvent.click(screen.getByTestId("message-send-button"));

    await waitFor(() => {
      expect(screen.getByTestId("message-input-error")).toBeInTheDocument();
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows error and does not call onSend when input is whitespace only", async () => {
    render(<MessageInput onSend={onSend} isSending={false} maxLength={2000} />);

    fireEvent.change(screen.getByTestId("message-input"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByTestId("message-send-button"));

    await waitFor(() => {
      expect(screen.getByTestId("message-input-error")).toBeInTheDocument();
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows error when content exceeds maxLength", async () => {
    render(<MessageInput onSend={onSend} isSending={false} maxLength={2000} />);

    const longContent = "a".repeat(2001);
    fireEvent.change(screen.getByTestId("message-input"), {
      target: { value: longContent },
    });
    fireEvent.click(screen.getByTestId("message-send-button"));

    await waitFor(() => {
      expect(screen.getByTestId("message-input-error")).toBeInTheDocument();
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onSend with trimmed content and clears input on valid message", async () => {
    render(<MessageInput onSend={onSend} isSending={false} maxLength={2000} />);

    fireEvent.change(screen.getByTestId("message-input"), {
      target: { value: "  Hello friend  " },
    });
    fireEvent.click(screen.getByTestId("message-send-button"));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("Hello friend");
    });

    await waitFor(() => {
      expect(screen.getByTestId("message-input")).toHaveValue("");
    });
    expect(screen.queryByTestId("message-input-error")).not.toBeInTheDocument();
  });

  it("sends message on Enter key press", async () => {
    render(<MessageInput onSend={onSend} isSending={false} maxLength={2000} />);

    const input = screen.getByTestId("message-input");
    fireEvent.change(input, { target: { value: "Enter test" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("Enter test");
    });
  });

  it("does not send on Shift+Enter", () => {
    render(<MessageInput onSend={onSend} isSending={false} maxLength={2000} />);

    const input = screen.getByTestId("message-input");
    fireEvent.change(input, { target: { value: "No send" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input and button when isSending is true", () => {
    render(<MessageInput onSend={onSend} isSending={true} maxLength={2000} />);

    expect(screen.getByTestId("message-input")).toBeDisabled();
    expect(screen.getByTestId("message-send-button")).toBeDisabled();
  });

  it("clears error when user starts typing again", async () => {
    render(<MessageInput onSend={onSend} isSending={false} maxLength={2000} />);

    // Trigger error
    fireEvent.click(screen.getByTestId("message-send-button"));
    await waitFor(() => {
      expect(screen.getByTestId("message-input-error")).toBeInTheDocument();
    });

    // Type to clear error
    fireEvent.change(screen.getByTestId("message-input"), {
      target: { value: "h" },
    });

    expect(screen.queryByTestId("message-input-error")).not.toBeInTheDocument();
  });
});
