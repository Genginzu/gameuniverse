"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { focusInitial, rememberTrigger, trapTab } from "@/lib/dismissable-layer/focus";
import { pushLayer } from "@/lib/dismissable-layer/layerStack";
import { acquireScrollLock } from "@/lib/dismissable-layer/scrollLock";

export interface DismissableLayerOptions {
  /** The layer joins the layer stack only while `open` is true. */
  open: boolean;
  /** Called on Escape (top layer only) or a pointer down outside the inside regions. */
  onDismiss: () => void;
  /** Extra inside regions besides the container (trigger, rail, portals…). */
  insideRefs?: ReadonlyArray<RefObject<HTMLElement | null>>;
  /** Locks the page scroll while open (reference-counted across layers). */
  lockScroll?: boolean;
  /** Keeps Tab inside the container and focuses its first focusable at open. */
  trapFocus?: boolean;
  /** Element focused at open (takes precedence over the first focusable). */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Makes `containerRef` a dismissable layer (see GLOSSARY.md): Escape on the
 * top layer and a pointer down outside its inside regions call `onDismiss`;
 * the trigger gets the focus back on close.
 *
 * Call it before any effect of the same component that moves the focus, so
 * the trigger is captured first.
 */
export function useDismissableLayer(
  containerRef: RefObject<HTMLElement | null>,
  options: DismissableLayerOptions
): void {
  const { open, lockScroll = false, trapFocus = false } = options;
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const restoreFocus = rememberTrigger(container);
    const preferred = optionsRef.current.initialFocusRef?.current ?? null;
    if (container && (trapFocus || preferred)) focusInitial(container, preferred);
    const removeLayer = pushLayer({
      contains: (target) => {
        const regions = [containerRef, ...(optionsRef.current.insideRefs ?? [])];
        return regions.some((region) => region.current?.contains(target) ?? false);
      },
      dismiss: () => optionsRef.current.onDismiss(),
      onTab: trapFocus
        ? (event) => {
            if (containerRef.current) trapTab(containerRef.current, event);
          }
        : undefined,
    });
    return () => {
      removeLayer();
      restoreFocus();
    };
  }, [open, trapFocus, containerRef]);

  useEffect(() => {
    if (!open || !lockScroll) return;
    return acquireScrollLock();
  }, [open, lockScroll]);
}
