// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// --- Mock state variables (must be declared before vi.mock) ---

const mockHandleFileSelect = vi.fn();
const mockHandleCroppedUpload = vi.fn();
const mockHandleDelete = vi.fn();
const mockClearPreview = vi.fn();
const mockHandleUpload = vi.fn();

let mockPreviewUrl: string | null = null;
let mockError: string | null = null;

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/hooks/useImageUpload", () => ({
  useImageUpload: () => ({
    previewUrl: mockPreviewUrl,
    uploading: false,
    progress: 0,
    error: mockError,
    handleFileSelect: mockHandleFileSelect,
    handleUpload: mockHandleUpload,
    handleCroppedUpload: mockHandleCroppedUpload,
    handleDelete: mockHandleDelete,
    clearPreview: mockClearPreview,
  }),
}));

vi.mock("@/components/shared/CropEditor", () => ({
  CropEditor: ({
    onConfirm,
    onCancel,
    disabled,
  }: {
    onConfirm: (blob: Blob) => void;
    onCancel: () => void;
    disabled?: boolean;
  }) => (
    <div data-testid="crop-editor" data-disabled={disabled}>
      <button onClick={() => onConfirm(new Blob(["test"], { type: "image/webp" }))}>
        mock-confirm
      </button>
      <button onClick={onCancel}>mock-cancel</button>
    </div>
  ),
}));

import { ImageUploader } from "@/components/shared/ImageUploader";

// --- Default props ---

const defaultProps = {
  context: "avatars" as const,
  currentImageUrl: null,
  aspectRatio: "1:1" as const,
  onUploadSuccess: vi.fn(),
};

beforeEach(() => {
  mockPreviewUrl = null;
  mockError = null;
  vi.clearAllMocks();
});

describe("ImageUploader", () => {
  it("shows drop zone when no file is selected", () => {
    render(<ImageUploader {...defaultProps} />);

    // Drop zone should be visible (role="button" with aria-label)
    expect(screen.getByRole("button", { name: "selectImage" })).toBeDefined();

    // CropEditor should NOT be rendered
    expect(screen.queryByTestId("crop-editor")).toBeNull();
  });

  it("shows CropEditor when previewUrl is set", () => {
    mockPreviewUrl = "blob:http://localhost/fake-preview";

    render(<ImageUploader {...defaultProps} />);

    expect(screen.getByTestId("crop-editor")).toBeDefined();

    // Drop zone should NOT be visible
    expect(screen.queryByRole("button", { name: "selectImage" })).toBeNull();
  });

  it("calls handleCroppedUpload when CropEditor confirm is clicked", () => {
    mockPreviewUrl = "blob:http://localhost/fake-preview";

    render(<ImageUploader {...defaultProps} />);

    const confirmBtn = screen.getByText("mock-confirm");
    fireEvent.click(confirmBtn);

    expect(mockHandleCroppedUpload).toHaveBeenCalledTimes(1);
    const blob = mockHandleCroppedUpload.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
  });

  it("calls clearPreview when CropEditor cancel is clicked", () => {
    mockPreviewUrl = "blob:http://localhost/fake-preview";

    render(<ImageUploader {...defaultProps} />);

    const cancelBtn = screen.getByText("mock-cancel");
    fireEvent.click(cancelBtn);

    expect(mockClearPreview).toHaveBeenCalledTimes(1);
  });

  it("triggers handleFileSelect when a file is selected via input", () => {
    render(<ImageUploader {...defaultProps} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    const file = new File(["pixels"], "photo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockHandleFileSelect).toHaveBeenCalledTimes(1);
    expect(mockHandleFileSelect).toHaveBeenCalledWith(file);
  });

  it("displays error message when error is set", () => {
    mockError = "invalidFormat";

    render(<ImageUploader {...defaultProps} />);

    // The error message is translated via the mock: t("errorInvalidFormat") → "errorInvalidFormat"
    expect(screen.getByText("errorInvalidFormat")).toBeDefined();
  });
});
