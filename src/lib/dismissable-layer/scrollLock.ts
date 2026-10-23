/**
 * Reference-counted scroll lock: the first acquirer saves the page overflow,
 * the last release restores it, so layers may close in any order.
 */

let holders = 0;
let previousOverflow = "";

/** Locks the page scroll. Returns the function that releases this hold. */
export function acquireScrollLock(): () => void {
  if (holders === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  holders += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders -= 1;
    if (holders === 0) document.body.style.overflow = previousOverflow;
  };
}
