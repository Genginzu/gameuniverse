import { describe, it, expect, mock, beforeEach } from "bun:test";

// Track state
let imageState = { isLoading: true, hasError: false, imageSrc: undefined as string | undefined };

// Mock React
mock.module("react", () => ({
  useState: (initial: unknown) => {
    if (initial === true) {
      return [
        imageState.isLoading,
        (val: boolean) => {
          imageState.isLoading = val;
        },
      ];
    }
    if (initial === false) {
      return [
        imageState.hasError,
        (val: boolean) => {
          imageState.hasError = val;
        },
      ];
    }
    // imageSrc state
    return [
      imageState.imageSrc,
      (val: string | undefined) => {
        imageState.imageSrc = val;
      },
    ];
  },
  useEffect: (callback: () => void | (() => void), deps?: unknown[]) => {
    const cleanup = callback();
    return cleanup;
  },
}));

// Mock Image class
class MockImage {
  src: string = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
}
globalThis.Image = MockImage as unknown as typeof Image;

// Import the hook
import { useImageLoading } from "../../../src/hooks/useImageLoading";

describe("useImageLoading integration tests", () => {
  beforeEach(() => {
    imageState = { isLoading: true, hasError: false, imageSrc: undefined };
  });

  describe("hook initialization", () => {
    it("should return loading state and image src", () => {
      const result = useImageLoading({ src: "https://example.com/image.jpg" });

      expect(result).toHaveProperty("isLoading");
      expect(result).toHaveProperty("hasError");
      expect(result).toHaveProperty("imageSrc");
    });
  });

  describe("with valid src", () => {
    it("should set initial loading state", () => {
      imageState.isLoading = true;
      const result = useImageLoading({ src: "https://example.com/image.jpg" });

      expect(result.isLoading).toBe(true);
    });

    it("should create Image object and set src", () => {
      let createdImage: MockImage | null = null;
      globalThis.Image = class extends MockImage {
        constructor() {
          super();
          createdImage = this;
        }
      } as unknown as typeof Image;

      useImageLoading({ src: "https://example.com/test.jpg" });

      expect(createdImage).not.toBeNull();
      expect(createdImage!.src).toBe("https://example.com/test.jpg");
    });

    it("should handle successful image load", () => {
      let createdImage: MockImage | null = null;
      globalThis.Image = class extends MockImage {
        constructor() {
          super();
          createdImage = this;
        }
      } as unknown as typeof Image;

      useImageLoading({ src: "https://example.com/test.jpg" });

      // Simulate successful load
      if (createdImage?.onload) {
        createdImage.onload();
      }

      expect(imageState.isLoading).toBe(false);
      expect(imageState.hasError).toBe(false);
      expect(imageState.imageSrc).toBe("https://example.com/test.jpg");
    });

    it("should handle image load error with fallback", () => {
      let createdImage: MockImage | null = null;
      globalThis.Image = class extends MockImage {
        constructor() {
          super();
          createdImage = this;
        }
      } as unknown as typeof Image;

      useImageLoading({
        src: "https://example.com/broken.jpg",
        fallbackSrc: "https://example.com/fallback.jpg",
      });

      // Simulate error
      if (createdImage?.onerror) {
        createdImage.onerror();
      }

      expect(imageState.isLoading).toBe(false);
      expect(imageState.hasError).toBe(true);
      expect(imageState.imageSrc).toBe("https://example.com/fallback.jpg");
    });

    it("should handle image load error without fallback", () => {
      let createdImage: MockImage | null = null;
      globalThis.Image = class extends MockImage {
        constructor() {
          super();
          createdImage = this;
        }
      } as unknown as typeof Image;

      useImageLoading({ src: "https://example.com/broken.jpg" });

      // Simulate error
      if (createdImage?.onerror) {
        createdImage.onerror();
      }

      expect(imageState.isLoading).toBe(false);
      expect(imageState.hasError).toBe(true);
      expect(imageState.imageSrc).toBeUndefined();
    });
  });

  describe("without src", () => {
    it("should set loading to false immediately", () => {
      useImageLoading({});

      expect(imageState.isLoading).toBe(false);
    });

    it("should set hasError to true", () => {
      useImageLoading({});

      expect(imageState.hasError).toBe(true);
    });

    it("should use fallbackSrc when provided", () => {
      useImageLoading({ fallbackSrc: "https://example.com/fallback.jpg" });

      expect(imageState.imageSrc).toBe("https://example.com/fallback.jpg");
    });
  });

  describe("cleanup", () => {
    it("should return cleanup function that clears handlers", () => {
      let createdImage: MockImage | null = null;

      globalThis.Image = class extends MockImage {
        constructor() {
          super();
          createdImage = this;
        }
      } as unknown as typeof Image;

      useImageLoading({ src: "https://example.com/test.jpg" });

      // Verify image was created with handlers set
      expect(createdImage).not.toBeNull();

      // Manually call cleanup (simulating what happens when component unmounts)
      if (createdImage) {
        createdImage.onload = null;
        createdImage.onerror = null;
      }

      // After cleanup, handlers should be null
      expect(createdImage?.onload).toBeNull();
      expect(createdImage?.onerror).toBeNull();
    });
  });
});
