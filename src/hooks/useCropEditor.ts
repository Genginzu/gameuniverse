import { useState, useCallback, useRef } from "react";
import type { CropParams, CropState } from "@/types/crop";
import { ZOOM_STEP } from "@/types/upload";
import {
  clampPosition,
  zoomAroundCenter,
  getCropParamsFromState,
  getTouchDistance,
} from "@/lib/utils/cropEditorUtils";

interface UseCropEditorParams {
  imageSize: { width: number; height: number };
  viewportSize: { width: number; height: number };
  aspectRatio: number;
}

interface UseCropEditorReturn {
  state: CropState;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  setZoom: (zoom: number) => void;
  getCropParams: () => CropParams;
}

export function useCropEditor({
  imageSize,
  viewportSize,
}: UseCropEditorParams): UseCropEditorReturn {
  const [state, setState] = useState<CropState>({ x: 0, y: 0, zoom: 1 });

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchZoom = useRef(1);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - state.x, y: e.clientY - state.y };
    },
    [state.x, state.y]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      const pos = clampPosition(newX, newY, state.zoom, imageSize, viewportSize);
      setState((prev) => ({ ...prev, x: pos.x, y: pos.y }));
    },
    [state.zoom, imageSize, viewportSize]
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const direction = e.deltaY > 0 ? -1 : 1;
      const newZoom = state.zoom + direction * ZOOM_STEP;
      setState(zoomAroundCenter(state, newZoom, imageSize, viewportSize));
    },
    [state, imageSize, viewportSize]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        dragStart.current = {
          x: e.touches[0].clientX - state.x,
          y: e.touches[0].clientY - state.y,
        };
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        lastTouchDist.current = getTouchDistance(e.touches[0], e.touches[1]);
        lastTouchZoom.current = state.zoom;
      }
    },
    [state.x, state.y, state.zoom]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isDragging.current) {
        const newX = e.touches[0].clientX - dragStart.current.x;
        const newY = e.touches[0].clientY - dragStart.current.y;
        const pos = clampPosition(newX, newY, state.zoom, imageSize, viewportSize);
        setState((prev) => ({ ...prev, x: pos.x, y: pos.y }));
      } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = dist / lastTouchDist.current;
        const newZoom = lastTouchZoom.current * scale;
        setState(zoomAroundCenter(state, newZoom, imageSize, viewportSize));
      }
    },
    [state, imageSize, viewportSize]
  );

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastTouchDist.current = null;
  }, []);

  const setZoom = useCallback(
    (zoom: number) => {
      setState((prev) => zoomAroundCenter(prev, zoom, imageSize, viewportSize));
    },
    [imageSize, viewportSize]
  );

  const getCropParams = useCallback(
    () => getCropParamsFromState(state, viewportSize),
    [state, viewportSize]
  );

  return {
    state,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onWheel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    setZoom,
    getCropParams,
  };
}
