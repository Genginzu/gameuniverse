import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCropEditor } from "@/hooks/useCropEditor";

// Standard test setup per task instructions
const defaultParams = {
  imageSize: { width: 800, height: 600 },
  viewportSize: { width: 400, height: 400 },
  aspectRatio: 1,
};

/**
 * Helper: create a minimal React.MouseEvent-like object.
 * Only the fields used by the hook are provided.
 */
function mouseEvent(overrides: Partial<React.MouseEvent> = {}): React.MouseEvent {
  return {
    clientX: 0,
    clientY: 0,
    preventDefault: () => {},
    ...overrides,
  } as unknown as React.MouseEvent;
}

/**
 * Helper: create a minimal React.WheelEvent-like object.
 */
function wheelEvent(deltaY: number): React.WheelEvent {
  return {
    deltaY,
    preventDefault: () => {},
  } as unknown as React.WheelEvent;
}

describe("useCropEditor", () => {
  // ── Initialization (Exigences 2.1, 3.1) ──────────────────────────────

  describe("initialization", () => {
    it("starts with x=0, y=0, zoom=1", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      expect(result.current.state).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it("exposes handlers, setZoom, and getCropParams", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      expect(typeof result.current.handlers.onMouseDown).toBe("function");
      expect(typeof result.current.handlers.onMouseMove).toBe("function");
      expect(typeof result.current.handlers.onMouseUp).toBe("function");
      expect(typeof result.current.handlers.onWheel).toBe("function");
      expect(typeof result.current.handlers.onTouchStart).toBe("function");
      expect(typeof result.current.handlers.onTouchMove).toBe("function");
      expect(typeof result.current.handlers.onTouchEnd).toBe("function");
      expect(typeof result.current.setZoom).toBe("function");
      expect(typeof result.current.getCropParams).toBe("function");
    });
  });

  // ── getCropParams (Exigences 2.1, 3.2) ───────────────────────────────

  describe("getCropParams", () => {
    it("returns correct params at initial state (zoom=1, position=0,0)", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      const params = result.current.getCropParams();
      // getCropParamsFromState computes -state.x/zoom → -0/1 = -0, which is ≈ 0
      expect(params.sourceX).toBeCloseTo(0);
      expect(params.sourceY).toBeCloseTo(0);
      expect(params.sourceWidth).toBe(400);
      expect(params.sourceHeight).toBe(400);
    });

    it("returns adjusted params after zoom to 2", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => result.current.setZoom(2));

      const params = result.current.getCropParams();
      // At zoom 2, sourceWidth = viewportW / zoom = 400 / 2 = 200
      expect(params.sourceWidth).toBe(200);
      expect(params.sourceHeight).toBe(200);
    });
  });

  // ── setZoom (Exigences 3.1, 3.4) ─────────────────────────────────────

  describe("setZoom", () => {
    it("updates zoom to the requested value", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => result.current.setZoom(2));

      expect(result.current.state.zoom).toBe(2);
    });

    it("clamps zoom below ZOOM_MIN (1) to 1", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => result.current.setZoom(0.5));

      expect(result.current.state.zoom).toBe(1);
    });

    it("clamps zoom above ZOOM_MAX (3) to 3", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => result.current.setZoom(5));

      expect(result.current.state.zoom).toBe(3);
    });
  });

  // ── Mouse drag / pan (Exigences 2.1, 2.3) ────────────────────────────

  describe("mouse drag", () => {
    it("updates position after mouseDown + mouseMove", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      // Zoom to 2 first so there's room to pan
      // At zoom 2: displayW = 800*2 = 1600, displayH = 600*2 = 1200
      // minX = -(1600-400) = -1200, minY = -(1200-400) = -800
      act(() => result.current.setZoom(2));

      // Start drag at clientX=100, clientY=100
      act(() => {
        result.current.handlers.onMouseDown(mouseEvent({ clientX: 100, clientY: 100 }));
      });

      // Move to clientX=80, clientY=70 → delta = -20, -30
      act(() => {
        result.current.handlers.onMouseMove(mouseEvent({ clientX: 80, clientY: 70 }));
      });

      act(() => {
        result.current.handlers.onMouseUp();
      });

      // Position should have changed (negative direction = panning image left/up)
      expect(result.current.state.x).toBeLessThan(0);
      expect(result.current.state.y).toBeLessThan(0);
    });

    it("does not move without mouseDown", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => result.current.setZoom(2));
      const initialState = { ...result.current.state };

      // Move without pressing down first
      act(() => {
        result.current.handlers.onMouseMove(mouseEvent({ clientX: 50, clientY: 50 }));
      });

      expect(result.current.state.x).toBe(initialState.x);
      expect(result.current.state.y).toBe(initialState.y);
    });

    it("clamps position to prevent empty zones when dragging beyond limits", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      // At zoom 1: displayW = 800, displayH = 600
      // minX = -(800-400) = -400, minY = -(600-400) = -200
      // maxX = 0, maxY = 0

      // Try to drag to positive x (would show empty left side)
      act(() => {
        result.current.handlers.onMouseDown(mouseEvent({ clientX: 0, clientY: 0 }));
      });
      act(() => {
        result.current.handlers.onMouseMove(mouseEvent({ clientX: 500, clientY: 500 }));
      });
      act(() => {
        result.current.handlers.onMouseUp();
      });

      // x should be clamped to 0 (can't go positive)
      expect(result.current.state.x).toBe(0);
      // y should be clamped to 0 (can't go positive)
      expect(result.current.state.y).toBe(0);
    });

    it("clamps position at negative extreme", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      // At zoom 1: minX = -(800-400) = -400, minY = -(600-400) = -200
      act(() => {
        result.current.handlers.onMouseDown(mouseEvent({ clientX: 0, clientY: 0 }));
      });
      act(() => {
        result.current.handlers.onMouseMove(mouseEvent({ clientX: -9999, clientY: -9999 }));
      });
      act(() => {
        result.current.handlers.onMouseUp();
      });

      // x clamped to minX = -400
      expect(result.current.state.x).toBe(-400);
      // y clamped to minY = -200
      expect(result.current.state.y).toBe(-200);
    });
  });

  // ── Wheel zoom (Exigences 3.2, 3.5) ──────────────────────────────────

  describe("wheel zoom", () => {
    it("zooms in on negative deltaY (scroll up)", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => {
        result.current.handlers.onWheel(wheelEvent(-100));
      });

      // ZOOM_STEP = 0.01, direction = +1 → zoom = 1 + 0.01 = 1.01
      expect(result.current.state.zoom).toBeGreaterThan(1);
    });

    it("zooms out on positive deltaY (scroll down)", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      // First zoom in so we can zoom out
      act(() => result.current.setZoom(2));

      act(() => {
        result.current.handlers.onWheel(wheelEvent(100));
      });

      // Should have decreased from 2
      expect(result.current.state.zoom).toBeLessThan(2);
    });

    it("does not zoom below ZOOM_MIN via wheel", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      // Zoom is at 1 (ZOOM_MIN), scroll down to try to go below
      act(() => {
        result.current.handlers.onWheel(wheelEvent(100));
      });

      expect(result.current.state.zoom).toBe(1);
    });
  });

  // ── getCropParams after zoom (Exigences 3.2, 3.5) ────────────────────

  describe("getCropParams after zoom", () => {
    it("sourceWidth is viewportW / zoom after zooming to 2", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => result.current.setZoom(2));

      const params = result.current.getCropParams();
      expect(params.sourceWidth).toBe(200); // 400 / 2
      expect(params.sourceHeight).toBe(200); // 400 / 2
    });

    it("sourceWidth is viewportW / zoom after zooming to 3", () => {
      const { result } = renderHook(() => useCropEditor(defaultParams));

      act(() => result.current.setZoom(3));

      const params = result.current.getCropParams();
      expect(params.sourceWidth).toBeCloseTo(400 / 3, 5);
      expect(params.sourceHeight).toBeCloseTo(400 / 3, 5);
    });
  });
});
