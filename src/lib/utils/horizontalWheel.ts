/**
 * Maps a vertical mouse wheel gesture to horizontal scrolling for a rail.
 *
 * Returns the horizontal delta to apply, or `null` to let the page scroll
 * vertically: native horizontal gestures (trackpad, shift+wheel), zoom
 * (ctrl+wheel), rails without overflow, and rails already at the edge in the
 * scroll direction all fall through to the browser.
 */

const LINE_HEIGHT_PX = 16;
const EDGE_TOLERANCE_PX = 1;

export interface HorizontalWheelInput {
  deltaX: number;
  deltaY: number;
  /** `WheelEvent.deltaMode`: 0 = pixels, 1 = lines, 2 = pages. */
  deltaMode: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

function toPixels(delta: number, deltaMode: number, pageWidth: number): number {
  if (deltaMode === 1) return delta * LINE_HEIGHT_PX;
  if (deltaMode === 2) return delta * pageWidth;
  return delta;
}

export function resolveHorizontalWheel(input: HorizontalWheelInput): number | null {
  const { deltaX, deltaY, ctrlKey, shiftKey, scrollLeft, scrollWidth, clientWidth } = input;

  if (ctrlKey || shiftKey) return null;
  if (deltaY === 0 || Math.abs(deltaX) >= Math.abs(deltaY)) return null;

  const maxScroll = scrollWidth - clientWidth;
  if (maxScroll <= EDGE_TOLERANCE_PX) return null;

  const delta = toPixels(deltaY, input.deltaMode, clientWidth);
  const atStart = scrollLeft <= EDGE_TOLERANCE_PX;
  const atEnd = scrollLeft >= maxScroll - EDGE_TOLERANCE_PX;

  if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return null;

  return delta;
}
