import type { CropParams, CropState } from "@/types/crop";
import { ZOOM_MIN, ZOOM_MAX } from "@/types/upload";

/**
 * Clamp zoom to [ZOOM_MIN, ZOOM_MAX].
 */
export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/**
 * Clamp image position so the zoomed image fully covers the viewport.
 * x, y are CSS offsets of the image relative to the viewport origin.
 * The image displayed size is imageSize * zoom.
 * Constraints: x <= 0 and x >= -(displayW - viewportW), same for y.
 */
export function clampPosition(
  x: number,
  y: number,
  zoom: number,
  imageSize: { width: number; height: number },
  viewportSize: { width: number; height: number }
): { x: number; y: number } {
  const displayW = imageSize.width * zoom;
  const displayH = imageSize.height * zoom;

  const minX = -(displayW - viewportSize.width);
  const minY = -(displayH - viewportSize.height);

  return {
    x: Math.min(0, Math.max(minX, x)),
    y: Math.min(0, Math.max(minY, y)),
  };
}

/**
 * Compute new position after a zoom change so the viewport center
 * stays on the same source point.
 */
export function zoomAroundCenter(
  state: CropState,
  newZoom: number,
  imageSize: { width: number; height: number },
  viewportSize: { width: number; height: number }
): CropState {
  const clamped = clampZoom(newZoom);
  const oldZoom = state.zoom;

  // Center of viewport in source coordinates before zoom
  const centerSrcX = (viewportSize.width / 2 - state.x) / oldZoom;
  const centerSrcY = (viewportSize.height / 2 - state.y) / oldZoom;

  // New position so the same source point stays at viewport center
  const newX = viewportSize.width / 2 - centerSrcX * clamped;
  const newY = viewportSize.height / 2 - centerSrcY * clamped;

  const pos = clampPosition(newX, newY, clamped, imageSize, viewportSize);
  return { x: pos.x, y: pos.y, zoom: clamped };
}

/**
 * Convert CSS crop state to source image coordinates.
 */
export function getCropParamsFromState(
  state: CropState,
  viewportSize: { width: number; height: number }
): CropParams {
  return {
    sourceX: -state.x / state.zoom,
    sourceY: -state.y / state.zoom,
    sourceWidth: viewportSize.width / state.zoom,
    sourceHeight: viewportSize.height / state.zoom,
  };
}

/**
 * Compute the distance between two touch points.
 */
export function getTouchDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
