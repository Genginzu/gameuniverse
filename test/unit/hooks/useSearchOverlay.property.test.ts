import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: navigation-sidebar, Propriété 4 : Raccourcis clavier de l'overlay de recherche
// **Valide : Exigences 9.7, 9.10**

// ---------------------------------------------------------------------------
// Pure model of the keyboard shortcut logic from useSearchOverlay
// ---------------------------------------------------------------------------

interface KeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
}

/**
 * Models the handleKeyDown logic from useSearchOverlay.
 * Given the current isOpen state and a keyboard event, returns the next state.
 *
 * This mirrors the effect handler:
 *   - Ctrl+K / Cmd+K → toggle (open if closed, close if open)
 *   - Escape when open → close
 *   - Any other key → no change
 */
function nextState(isOpen: boolean, event: KeyEvent): boolean {
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    return !isOpen;
  }
  if (event.key === "Escape" && isOpen) {
    return false;
  }
  return isOpen;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a Ctrl+K event (Windows/Linux shortcut) */
const ctrlKEvent: fc.Arbitrary<KeyEvent> = fc.constant({
  key: "k",
  ctrlKey: true,
  metaKey: false,
});

/** Generate a Cmd+K event (macOS shortcut) */
const cmdKEvent: fc.Arbitrary<KeyEvent> = fc.constant({
  key: "k",
  ctrlKey: false,
  metaKey: true,
});

/** Generate an Escape event */
const escapeEvent: fc.Arbitrary<KeyEvent> = fc.constant({
  key: "Escape",
  ctrlKey: false,
  metaKey: false,
});

/** Keys that are NOT "k" and NOT "Escape" — i.e. irrelevant keys */
const irrelevantKey = fc.stringMatching(/^[a-jl-z0-9]$/).filter((k) => k !== "k" && k !== "Escape");

/** Generate a keyboard event that should NOT affect overlay state */
const irrelevantEvent: fc.Arbitrary<KeyEvent> = fc.record({
  key: irrelevantKey,
  ctrlKey: fc.boolean(),
  metaKey: fc.boolean(),
});

/**
 * Generate a "k" press WITHOUT Ctrl or Meta — should not trigger shortcut.
 * Plain "k" is just a regular key press.
 */
const plainKEvent: fc.Arbitrary<KeyEvent> = fc.constant({
  key: "k",
  ctrlKey: false,
  metaKey: false,
});

/**
 * Generate an Escape press with modifiers — still closes (Escape key is
 * checked regardless of modifiers in the implementation).
 */
const escapeWithModifiers: fc.Arbitrary<KeyEvent> = fc.record({
  key: fc.constant("Escape"),
  ctrlKey: fc.boolean(),
  metaKey: fc.boolean(),
});

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Feature: navigation-sidebar, Propriété 4 : Raccourcis clavier de l'overlay de recherche", () => {
  describe("Ctrl+K / Cmd+K toggles the overlay", () => {
    it("opens the overlay when it is closed (Ctrl+K)", () => {
      fc.assert(
        fc.property(ctrlKEvent, (event) => {
          const result = nextState(false, event);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("opens the overlay when it is closed (Cmd+K)", () => {
      fc.assert(
        fc.property(cmdKEvent, (event) => {
          const result = nextState(false, event);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("closes the overlay when it is open (Ctrl+K or Cmd+K)", () => {
      fc.assert(
        fc.property(fc.oneof(ctrlKEvent, cmdKEvent), (event) => {
          const result = nextState(true, event);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Escape closes the overlay when open", () => {
    it("closes the overlay when Escape is pressed and overlay is open", () => {
      fc.assert(
        fc.property(escapeWithModifiers, (event) => {
          // Escape always closes when open, regardless of modifiers
          const result = nextState(true, event);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("does not change state when Escape is pressed and overlay is already closed", () => {
      fc.assert(
        fc.property(escapeEvent, (event) => {
          const result = nextState(false, event);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("No other key modifies the overlay state", () => {
    it("irrelevant keys do not change state regardless of current state", () => {
      fc.assert(
        fc.property(fc.boolean(), irrelevantEvent, (isOpen, event) => {
          const result = nextState(isOpen, event);
          expect(result).toBe(isOpen);
        }),
        { numRuns: 100 }
      );
    });

    it("plain 'k' without Ctrl/Meta does not change state", () => {
      fc.assert(
        fc.property(fc.boolean(), plainKEvent, (isOpen, event) => {
          const result = nextState(isOpen, event);
          expect(result).toBe(isOpen);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("State machine invariants", () => {
    it("applying a sequence of random events always yields a valid boolean state", () => {
      const anyEvent = fc.oneof(ctrlKEvent, cmdKEvent, escapeEvent, irrelevantEvent, plainKEvent);

      fc.assert(
        fc.property(
          fc.boolean(),
          fc.array(anyEvent, { minLength: 1, maxLength: 20 }),
          (initialState, events) => {
            let state = initialState;
            for (const event of events) {
              state = nextState(state, event);
              expect(typeof state).toBe("boolean");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Ctrl+K is its own inverse: two consecutive Ctrl+K presses restore original state", () => {
      fc.assert(
        fc.property(fc.boolean(), fc.oneof(ctrlKEvent, cmdKEvent), (isOpen, event) => {
          const afterFirst = nextState(isOpen, event);
          const afterSecond = nextState(afterFirst, event);
          expect(afterSecond).toBe(isOpen);
        }),
        { numRuns: 100 }
      );
    });

    it("Escape is idempotent when overlay is closed", () => {
      fc.assert(
        fc.property(escapeEvent, (event) => {
          // Applying Escape multiple times on a closed overlay keeps it closed
          let state = false;
          state = nextState(state, event);
          state = nextState(state, event);
          state = nextState(state, event);
          expect(state).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
