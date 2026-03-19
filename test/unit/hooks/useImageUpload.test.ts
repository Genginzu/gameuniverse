import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock upload validation
vi.mock("@/lib/validations/uploadValidation", () => ({
  isAllowedMimeType: vi.fn(() => true),
  isValidFileSize: vi.fn(() => true),
}));

// --- XHR Mock ---
type LoadHandler = () => void;
type ProgressHandler = (e: { lengthComputable: boolean; loaded: number; total: number }) => void;

let lastXhrInstance: MockXHR | null = null;

class MockXHR {
  status = 200;
  private loadHandler: LoadHandler | null = null;
  private progressHandler: ProgressHandler | null = null;

  upload = {
    addEventListener: vi.fn((_event: string, handler: ProgressHandler) => {
      this.progressHandler = handler;
    }),
  };

  addEventListener = vi.fn((event: string, handler: LoadHandler) => {
    if (event === "load") this.loadHandler = handler;
  });

  open = vi.fn();
  setRequestHeader = vi.fn();

  send = vi.fn(() => {
    if (this.progressHandler) {
      this.progressHandler({ lengthComputable: true, loaded: 100, total: 100 });
    }
    if (this.loadHandler) this.loadHandler();
  });

  constructor() {
    lastXhrInstance = this;
  }
}

// --- Constants ---
const SIGNED_URL = "https://storage.example.com/signed";
const PUBLIC_URL = "https://storage.example.com/public/image.webp";

const defaultParams = {
  context: "avatars" as const,
  onUploadSuccess: vi.fn(),
  onDelete: vi.fn(),
};

// --- Helpers ---
function mockFetchSuccess() {
  return vi.fn((url: string) => {
    if (url === "/api/upload") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ signedUrl: SIGNED_URL, publicUrl: PUBLIC_URL }),
      });
    }
    if (url === "/api/upload/confirm") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }
    return Promise.resolve({ ok: false });
  }) as unknown as typeof fetch;
}

function mockFetchPresignedFailure() {
  return vi.fn(() => Promise.resolve({ ok: false, status: 500 })) as unknown as typeof fetch;
}

describe("useImageUpload — Blob / handleCroppedUpload", () => {
  const originalFetch = globalThis.fetch;
  const originalXHR = globalThis.XMLHttpRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    lastXhrInstance = null;
    globalThis.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest;
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.XMLHttpRequest = originalXHR;
  });

  it("handleCroppedUpload sends Blob with 'image/webp' content type", async () => {
    globalThis.fetch = mockFetchSuccess();

    const { useImageUpload } = await import("@/hooks/useImageUpload");
    const { result } = renderHook(() => useImageUpload(defaultParams));

    const blob = new Blob(["test-image-data"], { type: "image/webp" });

    await act(async () => {
      await result.current.handleCroppedUpload(blob);
    });

    // Verify presigned URL request sent contentType: "image/webp"
    const fetchCalls = vi.mocked(globalThis.fetch).mock.calls;
    const presignedCall = fetchCalls.find(([url]) => url === "/api/upload");
    expect(presignedCall).toBeDefined();

    const presignedBody = JSON.parse(presignedCall![1]!.body as string);
    expect(presignedBody.contentType).toBe("image/webp");
    expect(presignedBody.fileSize).toBe(blob.size);

    // Verify XHR Content-Type header was set to "image/webp"
    expect(lastXhrInstance).not.toBeNull();
    expect(lastXhrInstance!.setRequestHeader).toHaveBeenCalledWith("Content-Type", "image/webp");

    // Verify onUploadSuccess was called with the public URL
    expect(defaultParams.onUploadSuccess).toHaveBeenCalledWith(PUBLIC_URL);
  });

  it("handleCroppedUpload handles API error gracefully", async () => {
    globalThis.fetch = mockFetchPresignedFailure();

    const { useImageUpload } = await import("@/hooks/useImageUpload");
    const { result } = renderHook(() => useImageUpload(defaultParams));

    const blob = new Blob(["test-image-data"], { type: "image/webp" });

    await act(async () => {
      await result.current.handleCroppedUpload(blob);
    });

    // Should have an error set
    expect(result.current.error).toBe("presignedFailed");
    // Should not be uploading anymore
    expect(result.current.uploading).toBe(false);
    // onUploadSuccess should NOT have been called
    expect(defaultParams.onUploadSuccess).not.toHaveBeenCalled();
  });

  it("handleUpload with File still uses file.type (non-regression)", async () => {
    globalThis.fetch = mockFetchSuccess();

    const { useImageUpload } = await import("@/hooks/useImageUpload");
    const { result } = renderHook(() => useImageUpload(defaultParams));

    const file = new File(["test-image-data"], "photo.png", { type: "image/png" });

    // Select the file first
    act(() => {
      result.current.handleFileSelect(file);
    });

    // Then upload
    await act(async () => {
      await result.current.handleUpload();
    });

    // Verify presigned URL request sent contentType: "image/png" (from file.type)
    const fetchCalls = vi.mocked(globalThis.fetch).mock.calls;
    const presignedCall = fetchCalls.find(([url]) => url === "/api/upload");
    expect(presignedCall).toBeDefined();

    const presignedBody = JSON.parse(presignedCall![1]!.body as string);
    expect(presignedBody.contentType).toBe("image/png");

    // Verify XHR Content-Type header was set to "image/png"
    expect(lastXhrInstance).not.toBeNull();
    expect(lastXhrInstance!.setRequestHeader).toHaveBeenCalledWith("Content-Type", "image/png");

    expect(defaultParams.onUploadSuccess).toHaveBeenCalledWith(PUBLIC_URL);
  });
});
