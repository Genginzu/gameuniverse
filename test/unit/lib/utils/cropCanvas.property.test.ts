// @vitest-environment jsdom
// Feature: image-crop-upload, Property 4: Dimensions de sortie conformes au contexte
// Feature: image-crop-upload, Property 5: cropCanvas produit un Blob WebP valide
import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { cropCanvas } from "@/lib/utils/cropCanvas";
import type { CropParams, CropOutputConfig } from "@/types/crop";
import {
  OUTPUT_DIMENSIONS,
  CROP_OUTPUT_FORMAT,
  CROP_OUTPUT_QUALITY,
  type UploadContext,
} from "@/types/upload";

// --- Helpers ---

function setupMockCanvas() {
  const capturedDimensions = { width: 0, height: 0 };

  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
    toBlob: vi.fn().mockImplementation((cb: BlobCallback) => {
      cb(new Blob(["data"], { type: "image/webp" }));
    }),
  };

  // Capture dimensions when they are set
  Object.defineProperty(mockCanvas, "width", {
    get: () => capturedDimensions.width,
    set: (v: number) => {
      capturedDimensions.width = v;
    },
  });
  Object.defineProperty(mockCanvas, "height", {
    get: () => capturedDimensions.height,
    set: (v: number) => {
      capturedDimensions.height = v;
    },
  });

  const original = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
    return original(tag);
  }) as typeof document.createElement);

  return capturedDimensions;
}

// --- Generators ---

const contextArb = fc.oneof(
  fc.constant("avatars" as UploadContext),
  fc.constant("banners" as UploadContext)
);

const cropParamsArb = fc.record({
  sourceX: fc.integer({ min: 0, max: 2000 }),
  sourceY: fc.integer({ min: 0, max: 2000 }),
  sourceWidth: fc.integer({ min: 1, max: 4000 }),
  sourceHeight: fc.integer({ min: 1, max: 4000 }),
}) satisfies fc.Arbitrary<CropParams>;

// --- Property Tests ---

describe("cropCanvas — Property-Based Tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 4: Dimensions de sortie conformes au contexte
   * Validates: Requirements 6.1, 6.2
   *
   * For any upload context ("avatars" or "banners") and any valid crop params,
   * the output canvas must have exactly the expected dimensions:
   * - avatars: 256×256
   * - banners: 1280×400
   */
  it("P4 — canvas output dimensions match OUTPUT_DIMENSIONS for the given context", async () => {
    await fc.assert(
      fc.asyncProperty(contextArb, cropParamsArb, async (context, cropParams) => {
        const capturedDimensions = setupMockCanvas();

        const expectedDims = OUTPUT_DIMENSIONS[context];
        const output: CropOutputConfig = {
          width: expectedDims.width,
          height: expectedDims.height,
          format: CROP_OUTPUT_FORMAT,
          quality: CROP_OUTPUT_QUALITY,
        };

        const fakeImage = {} as HTMLImageElement;
        await cropCanvas(fakeImage, cropParams, output);

        expect(capturedDimensions.width).toBe(expectedDims.width);
        expect(capturedDimensions.height).toBe(expectedDims.height);

        vi.restoreAllMocks();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: image-crop-upload, Property 5: cropCanvas produit un Blob WebP valide
   * Validates: Requirements 5.1, 5.2
   *
   * For any valid crop params (positive sourceX, sourceY, sourceWidth, sourceHeight),
   * cropCanvas must return a non-null Blob of type "image/webp" with size > 0.
   */
  it("P5 — cropCanvas produces a valid non-null WebP Blob with size > 0", async () => {
    await fc.assert(
      fc.asyncProperty(cropParamsArb, async (cropParams) => {
        setupMockCanvas();

        const output: CropOutputConfig = {
          width: 256,
          height: 256,
          format: CROP_OUTPUT_FORMAT,
          quality: CROP_OUTPUT_QUALITY,
        };

        const fakeImage = {} as HTMLImageElement;
        const blob = await cropCanvas(fakeImage, cropParams, output);

        expect(blob).not.toBeNull();
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe("image/webp");
        expect(blob.size).toBeGreaterThan(0);

        vi.restoreAllMocks();
      }),
      { numRuns: 100 }
    );
  });
});
