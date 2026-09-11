import { describe, it, expect } from "vitest";
import {
  clampZoom,
  clampPosition,
  zoomAroundCenter,
  getCropParamsFromState,
  getTouchDistance,
} from "@/lib/utils/cropEditorUtils";
import { ZOOM_MIN, ZOOM_MAX } from "@/types/upload";

describe("clampZoom", () => {
  it("below min -> ZOOM_MIN", () => {
    expect(clampZoom(0.5)).toBe(ZOOM_MIN);
  });

  it("above max -> ZOOM_MAX", () => {
    expect(clampZoom(5)).toBe(ZOOM_MAX);
  });

  it("within range -> unchanged", () => {
    expect(clampZoom(2)).toBe(2);
  });
});

describe("clampPosition", () => {
  const image = { width: 200, height: 200 };
  const viewport = { width: 100, height: 100 };

  it("x=0, y=0 stays at 0,0", () => {
    expect(clampPosition(0, 0, 1, image, viewport)).toEqual({ x: 0, y: 0 });
  });

  it("negative x within bounds stays", () => {
    // zoom=1: displayW=200, minX=-(200-100)=-100
    expect(clampPosition(-50, 0, 1, image, viewport)).toEqual({ x: -50, y: 0 });
  });

  it("x too negative gets clamped", () => {
    // minX = -100, so -150 clamps to -100
    expect(clampPosition(-150, 0, 1, image, viewport)).toEqual({ x: -100, y: 0 });
  });

  it("positive x gets clamped to 0", () => {
    expect(clampPosition(50, 0, 1, image, viewport)).toEqual({ x: 0, y: 0 });
  });
});

describe("zoomAroundCenter", () => {
  const image = { width: 200, height: 200 };
  const viewport = { width: 100, height: 100 };

  it("zoom clamped to range", () => {
    const result = zoomAroundCenter({ x: 0, y: 0, zoom: 1 }, 5, image, viewport);
    expect(result.zoom).toBe(ZOOM_MAX);
  });

  it("position adjusted to keep center", () => {
    const result = zoomAroundCenter({ x: 0, y: 0, zoom: 1 }, 2, image, viewport);
    expect(result.zoom).toBe(2);
    // Center source = (50 - 0)/1 = 50. newX = 50 - 50*2 = -50
    expect(result.x).toBe(-50);
    expect(result.y).toBe(-50);
  });

  it("result position is clamped", () => {
    // Start at extreme offset, zoom in further
    const result = zoomAroundCenter({ x: -100, y: -100, zoom: 1 }, 3, image, viewport);
    expect(result.zoom).toBe(3);
    // minX = -(200*3 - 100) = -500, minY same
    expect(result.x).toBeGreaterThanOrEqual(-500);
    expect(result.x).toBeLessThanOrEqual(0);
  });
});

describe("getCropParamsFromState", () => {
  const viewport = { width: 200, height: 200 };

  it("at zoom 1, x=0, y=0 -> full viewport", () => {
    const result = getCropParamsFromState({ x: 0, y: 0, zoom: 1 }, viewport);
    expect(result.sourceX).toBe(-0);
    expect(result.sourceY).toBe(-0);
    expect(result.sourceWidth).toBe(200);
    expect(result.sourceHeight).toBe(200);
  });

  it("at zoom 2, x=-100, y=-50", () => {
    expect(getCropParamsFromState({ x: -100, y: -50, zoom: 2 }, viewport)).toEqual({
      sourceX: 50,
      sourceY: 25,
      sourceWidth: 100,
      sourceHeight: 100,
    });
  });
});

describe("getTouchDistance", () => {
  const touch = (x: number, y: number) => ({ clientX: x, clientY: y }) as unknown as React.Touch;

  it("horizontal distance", () => {
    expect(getTouchDistance(touch(0, 0), touch(10, 0))).toBe(10);
  });

  it("diagonal distance (3,4,5 triangle)", () => {
    expect(getTouchDistance(touch(0, 0), touch(3, 4))).toBe(5);
  });

  it("same point -> 0", () => {
    expect(getTouchDistance(touch(5, 5), touch(5, 5))).toBe(0);
  });
});
