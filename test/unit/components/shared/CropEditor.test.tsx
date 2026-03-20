// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// --- ResizeObserver polyfill (not available in jsdom) ---
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// --- Mocks ---

const mockGetCropParams = vi.fn().mockReturnValue({
  sourceX: 0,
  sourceY: 0,
  sourceWidth: 400,
  sourceHeight: 400,
});
const mockSetZoom = vi.fn();

vi.mock("@/hooks/useCropEditor", () => ({
  useCropEditor: () => ({
    state: { x: 0, y: 0, zoom: 1 },
    handlers: {
      onMouseDown: vi.fn(),
      onMouseMove: vi.fn(),
      onMouseUp: vi.fn(),
      onWheel: vi.fn(),
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    },
    setZoom: mockSetZoom,
    getCropParams: mockGetCropParams,
  }),
}));

const mockCropCanvas = vi.fn();
vi.mock("@/lib/utils/cropCanvas", () => ({
  cropCanvas: (...args: unknown[]) => mockCropCanvas(...args),
}));

import { CropEditor } from "@/components/shared/CropEditor";

// --- Image mock ---

const OriginalImage = window.Image;

beforeEach(() => {
  (window as unknown as Record<string, unknown>).Image = class MockImage {
    crossOrigin = "";
    src = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 800;
    naturalHeight = 600;
    constructor() {
      setTimeout(() => this.onload?.(), 0);
    }
  };

  mockCropCanvas.mockResolvedValue(new Blob(["test"], { type: "image/webp" }));
});

afterEach(() => {
  (window as unknown as Record<string, unknown>).Image = OriginalImage;
  vi.clearAllMocks();
});

// --- Default props ---

const defaultProps = {
  imageSrc: "https://example.com/test.jpg",
  aspectRatio: "1:1" as const,
  outputSize: { width: 256, height: 256 },
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("CropEditor", () => {
  it("renders title, zoom slider, and action buttons after image loads", async () => {
    render(<CropEditor {...defaultProps} />);

    // Wait for the mocked Image onload to fire (setTimeout 0)
    await waitFor(() => {
      expect(screen.getByText("title")).toBeDefined();
    });

    // Zoom slider (input range)
    const slider = screen.getByRole("slider");
    expect(slider).toBeDefined();

    // Confirm and cancel buttons
    expect(screen.getByText("confirm")).toBeDefined();
    expect(screen.getByText("cancel")).toBeDefined();
  });

  it("calls onConfirm with a Blob when confirm button is clicked", async () => {
    render(<CropEditor {...defaultProps} />);

    // Wait for image to load
    await waitFor(() => {
      expect(screen.getByText("title")).toBeDefined();
    });

    const confirmBtn = screen.getByText("confirm");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockCropCanvas).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    const blob = defaultProps.onConfirm.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<CropEditor {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("title")).toBeDefined();
    });

    const cancelBtn = screen.getByText("cancel");
    fireEvent.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("applies disabled styles when disabled prop is true", async () => {
    const { container } = render(<CropEditor {...defaultProps} disabled />);

    await waitFor(() => {
      expect(screen.getByText("title")).toBeDefined();
    });

    // The root div should have the disabled classes
    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv.className).toContain("pointer-events-none");
    expect(rootDiv.className).toContain("opacity-60");
  });
});
