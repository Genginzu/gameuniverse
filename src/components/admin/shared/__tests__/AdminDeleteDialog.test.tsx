import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminDeleteDialog } from "../AdminDeleteDialog";

type DialogProps = Parameters<typeof AdminDeleteDialog>[0];

function renderDialog(overrides: Partial<DialogProps> = {}) {
  const props: DialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
    isDeleting: false,
    translationNamespace: "admin.test.deleteDialog",
    ...overrides,
  };
  render(<AdminDeleteDialog {...props} />);
  return props;
}

describe("AdminDeleteDialog", () => {
  it("renders nothing when closed", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title, warning, irreversible notice and confirm button", () => {
    renderDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("warning")).toBeInTheDocument();
    expect(screen.getByText("irreversible")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "confirm" })).toBeInTheDocument();
  });

  it.each([0, undefined])("hides the usage warning when usageCount is %s", (usageCount) => {
    renderDialog({ usageCount });
    expect(screen.queryByText("usageWarning")).not.toBeInTheDocument();
  });

  it("shows the usage warning and force label when the entity is used", () => {
    renderDialog({
      usageCount: 3,
      forceConfirmKey: "forceConfirm",
      forceWarningKey: "forceWarning",
    });
    expect(screen.getByText("usageWarning")).toBeInTheDocument();
    expect(screen.getByText("forceWarning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "forceConfirm" })).toBeInTheDocument();
  });

  it("keeps the default confirm label when unused even if a force key is provided", () => {
    renderDialog({ usageCount: 0, forceConfirmKey: "forceConfirm" });
    expect(screen.getByRole("button", { name: "confirm" })).toBeInTheDocument();
  });

  it("hides the delete action when blockOnUsage is set and the entity is used", () => {
    renderDialog({ usageCount: 2, blockOnUsage: true });
    expect(screen.queryByRole("button", { name: "confirm" })).not.toBeInTheDocument();
    expect(screen.queryByText("irreversible")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
  });

  it("calls onConfirm and onClose from the footer buttons", () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape when idle", () => {
    const props = renderDialog();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("cannot be dismissed while deleting", () => {
    const props = renderDialog({ isDeleting: true });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "cancel" })).toBeDisabled();
  });
});
