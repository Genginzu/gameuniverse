/**
 * Layer stack shared by every open dismissable layer (see GLOSSARY.md).
 * One listener per event type is attached to `window` while
 * the stack is non-empty, so the order of resolution is owned here rather
 * than by each component's own listeners.
 */

export interface StackedLayer {
  /** True when the node belongs to one of the layer's inside regions. */
  contains: (target: Node) => boolean;
  dismiss: () => void;
  /** Called for Tab presses while this layer is the top layer. */
  onTab?: (event: KeyboardEvent) => void;
}

const stack: StackedLayer[] = [];

function topLayer(): StackedLayer | undefined {
  return stack[stack.length - 1];
}

// Escape is resolved in the capture phase: the top layer always wins over
// local handlers.
function handleEscape(event: KeyboardEvent) {
  const top = topLayer();
  if (!top || event.key !== "Escape" || event.isComposing) return;
  event.preventDefault();
  top.dismiss();
}

// Tab is resolved in the bubble phase, so a component that consumes Tab
// itself (e.g. to cycle tabs) keeps it.
function handleTab(event: KeyboardEvent) {
  if (event.key !== "Tab" || event.defaultPrevented) return;
  topLayer()?.onTab?.(event);
}

// Walks the stack top-down: every layer the pointer is outside of is
// dismissed, until a layer that contains the target is reached.
function handlePointerDown(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  for (const layer of [...stack].reverse()) {
    if (layer.contains(target)) return;
    layer.dismiss();
  }
}

function attachListeners() {
  window.addEventListener("keydown", handleEscape, true);
  window.addEventListener("keydown", handleTab);
  window.addEventListener("pointerdown", handlePointerDown, true);
}

function detachListeners() {
  window.removeEventListener("keydown", handleEscape, true);
  window.removeEventListener("keydown", handleTab);
  window.removeEventListener("pointerdown", handlePointerDown, true);
}

/** Pushes a layer on top of the stack. Returns the function that removes it. */
export function pushLayer(layer: StackedLayer): () => void {
  if (stack.length === 0) attachListeners();
  stack.push(layer);
  return () => {
    const index = stack.indexOf(layer);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0) detachListeners();
  };
}
