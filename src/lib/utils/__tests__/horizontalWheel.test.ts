import { describe, it, expect } from "vitest";

import { resolveHorizontalWheel, type HorizontalWheelInput } from "@/lib/utils/horizontalWheel";

const BASE: HorizontalWheelInput = {
  deltaX: 0,
  deltaY: 100,
  deltaMode: 0,
  ctrlKey: false,
  shiftKey: false,
  scrollLeft: 200,
  scrollWidth: 1000,
  clientWidth: 400,
};

function resolve(overrides: Partial<HorizontalWheelInput>) {
  return resolveHorizontalWheel({ ...BASE, ...overrides });
}

describe("resolveHorizontalWheel", () => {
  it("turns a vertical wheel into a horizontal delta inside the rail", () => {
    expect(resolve({})).toBe(100);
    expect(resolve({ deltaY: -60 })).toBe(-60);
  });

  it("lets the page scroll once the rail reaches its end", () => {
    expect(resolve({ scrollLeft: 600 })).toBeNull();
    expect(resolve({ scrollLeft: 599.5 })).toBeNull();
  });

  it("lets the page scroll up once the rail is back at its start", () => {
    expect(resolve({ scrollLeft: 0, deltaY: -100 })).toBeNull();
  });

  it("keeps scrolling the rail towards the opposite edge", () => {
    expect(resolve({ scrollLeft: 0, deltaY: 100 })).toBe(100);
    expect(resolve({ scrollLeft: 600, deltaY: -100 })).toBe(-100);
  });

  it("ignores rails without horizontal overflow", () => {
    expect(resolve({ scrollWidth: 400 })).toBeNull();
  });

  it("leaves native horizontal gestures, shift and zoom to the browser", () => {
    expect(resolve({ deltaX: 120, deltaY: 20 })).toBeNull();
    expect(resolve({ shiftKey: true })).toBeNull();
    expect(resolve({ ctrlKey: true })).toBeNull();
    expect(resolve({ deltaY: 0 })).toBeNull();
  });

  it("converts line and page delta modes to pixels", () => {
    expect(resolve({ deltaY: 3, deltaMode: 1 })).toBe(48);
    expect(resolve({ deltaY: 1, deltaMode: 2 })).toBe(400);
  });
});
