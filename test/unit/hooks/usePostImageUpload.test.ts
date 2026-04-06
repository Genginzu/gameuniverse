import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/validations/uploadValidation", () => ({
  isAllowedMimeType: vi.fn((t: string) => t.startsWith("image/")),
  isValidFileSize: vi.fn(() => true),
}));

import { usePostImageUpload } from "@/hooks/usePostImageUpload";

describe("usePostImageUpload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("initial state has null previewUrl and uploadedUrl", () => {
    const { result } = renderHook(() => usePostImageUpload());
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.uploadedUrl).toBeNull();
    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handleFileSelect with invalid mime sets error invalidFormat", async () => {
    const { result } = renderHook(() => usePostImageUpload());

    const badFile = new File(["data"], "test.txt", { type: "text/plain" });

    await act(async () => {
      result.current.handleFileSelect(badFile);
    });

    expect(result.current.error).toBe("invalidFormat");
    expect(result.current.previewUrl).toBeNull();
  });

  it("clearImage resets state", async () => {
    const { result } = renderHook(() => usePostImageUpload());

    // Simulate a file that passes validation but we just test clearImage
    // First set an error state to have something to clear
    const badFile = new File(["data"], "test.txt", { type: "text/plain" });
    await act(async () => {
      result.current.handleFileSelect(badFile);
    });

    expect(result.current.error).toBe("invalidFormat");

    act(() => {
      result.current.clearImage();
    });

    expect(result.current.previewUrl).toBeNull();
    expect(result.current.uploadedUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
