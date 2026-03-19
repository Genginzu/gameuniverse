// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cropCanvas } from "@/lib/utils/cropCanvas";
import type { CropParams, CropOutputConfig } from "@/types/crop";

// --- Helpers ---

function createMockContext() {
  return { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
}

interface MockCanvasOptions {
  ctx?: CanvasRenderingContext2D | null;
  toBlobResult?: Blob | null;
}

function setupMockCanvas(opts: MockCanvasOptions = {}) {
  const ctx = opts.ctx !== undefined ? opts.ctx : createMockContext();
  const toBlobResult =
    opts.toBlobResult !== undefined ? opts.toBlobResult : new Blob(["img"], { type: "image/webp" });

  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(ctx),
    toBlob: vi.fn().mockImplementation((cb: BlobCallback) => cb(toBlobResult)),
  };

  const original = document.createElement.bind(document);
  const spy = vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
    return original(tag);
  }) as typeof document.createElement);

  return { mockCanvas, ctx, spy };
}

// --- Fixtures ---

const defaultCropParams: CropParams = {
  sourceX: 10,
  sourceY: 20,
  sourceWidth: 200,
  sourceHeight: 200,
};

const defaultOutput: CropOutputConfig = {
  width: 256,
  height: 256,
  format: "image/webp",
  quality: 0.9,
};

const fakeImage = {} as HTMLImageElement;

// --- Tests ---

describe("cropCanvas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Validates: Requirements 5.1, 5.2
   * Nominal case: cropCanvas returns a non-null WebP Blob.
   */
  it("returns a WebP Blob on success", async () => {
    const blob = new Blob(["pixel-data"], { type: "image/webp" });
    const { mockCanvas } = setupMockCanvas({ toBlobResult: blob });

    const result = await cropCanvas(fakeImage, defaultCropParams, defaultOutput);

    expect(result).toBe(blob);
    expect(result.type).toBe("image/webp");
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.9);
  });

  /**
   * Validates: Requirements 5.1, 5.5
   * Error case: toBlob returns null → promise rejects.
   */
  it("rejects when canvas.toBlob returns null", async () => {
    setupMockCanvas({ toBlobResult: null });

    await expect(cropCanvas(fakeImage, defaultCropParams, defaultOutput)).rejects.toThrow(
      "canvas.toBlob() returned null"
    );
  });

  /**
   * Validates: Requirements 6.1, 6.2
   * Canvas dimensions must match avatar output (256×256).
   */
  it("sets canvas dimensions to the output size (avatar 256×256)", async () => {
    const { mockCanvas } = setupMockCanvas();

    await cropCanvas(fakeImage, defaultCropParams, defaultOutput);

    expect(mockCanvas.width).toBe(256);
    expect(mockCanvas.height).toBe(256);
  });

  /**
   * Validates: Requirements 6.1, 6.2
   * Canvas dimensions must match banner output (1280×400).
   */
  it("sets canvas dimensions to the output size (banner 1280×400)", async () => {
    const bannerOutput: CropOutputConfig = {
      width: 1280,
      height: 400,
      format: "image/webp",
      quality: 0.9,
    };
    const { mockCanvas } = setupMockCanvas();

    await cropCanvas(fakeImage, defaultCropParams, bannerOutput);

    expect(mockCanvas.width).toBe(1280);
    expect(mockCanvas.height).toBe(400);
  });

  /**
   * Validates: Requirements 5.1
   * drawImage must receive correct source and destination parameters.
   */
  it("calls drawImage with correct source and destination params", async () => {
    const ctx = createMockContext();
    setupMockCanvas({ ctx });

    await cropCanvas(fakeImage, defaultCropParams, defaultOutput);

    expect(ctx.drawImage).toHaveBeenCalledWith(
      fakeImage,
      defaultCropParams.sourceX,
      defaultCropParams.sourceY,
      defaultCropParams.sourceWidth,
      defaultCropParams.sourceHeight,
      0,
      0,
      defaultOutput.width,
      defaultOutput.height
    );
  });

  /**
   * Validates: Requirements 5.5
   * When getContext returns null the promise must reject.
   */
  it("rejects when getContext returns null", async () => {
    setupMockCanvas({ ctx: null });

    await expect(cropCanvas(fakeImage, defaultCropParams, defaultOutput)).rejects.toThrow(
      "Failed to get canvas 2d context"
    );
  });

  /**
   * Validates: Requirements 5.2
   * Default format/quality from constants are used when not specified.
   */
  it("uses default format and quality when not specified in output", async () => {
    const outputNoDefaults = { width: 256, height: 256 } as CropOutputConfig;
    const { mockCanvas } = setupMockCanvas();

    await cropCanvas(fakeImage, defaultCropParams, outputNoDefaults);

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.9);
  });
});
