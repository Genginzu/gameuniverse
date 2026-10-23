/**
 * Focus handling of a dismissable layer: focus trap (Tab wraps inside the
 * container) and focus return to the trigger on close.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Focuses `preferred`, else the first focusable, unless focus is already inside. */
export function focusInitial(container: HTMLElement, preferred: HTMLElement | null): void {
  if (container.contains(document.activeElement)) return;
  const target = preferred ?? focusableIn(container)[0];
  target?.focus();
}

/** Keeps Tab / Shift+Tab cycling inside the container. */
export function trapTab(container: HTMLElement, event: KeyboardEvent): void {
  const focusable = focusableIn(container);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const outside = !container.contains(active);
  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Remembers the trigger (element focused at open). The returned function gives
 * the focus back to it, unless the user already moved the focus elsewhere.
 */
export function rememberTrigger(container: HTMLElement | null): () => void {
  const trigger = document.activeElement;
  return () => {
    if (!(trigger instanceof HTMLElement) || trigger === document.body) return;
    if (!trigger.isConnected) return;
    const active = document.activeElement;
    const focusIsLost = active === null || active === document.body;
    const focusIsInside = container?.contains(active) ?? false;
    if (focusIsLost || focusIsInside) trigger.focus();
  };
}
