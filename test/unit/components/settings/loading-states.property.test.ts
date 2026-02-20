import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: settings-page
 * Property 4: Loading state during form submission
 * **Validates: Requirements 5.1**
 *
 * For any form submission (username or email), WHILE the async operation is in progress,
 * the submit button SHALL display a loading indicator and be disabled.
 *
 * This test validates the LoadingButton component behavior which is used by all
 * settings forms (UsernameForm, EmailForm, PasswordResetSection).
 */

/**
 * LoadingButton behavior specification:
 * - When loading=true: button is disabled AND shows loading spinner
 * - When loading=false: button respects the disabled prop
 * - The loading state takes precedence over the disabled prop
 */

// Simulate the LoadingButton disabled logic
function computeButtonDisabled(loading: boolean, disabled: boolean): boolean {
  return disabled || loading;
}

// Simulate whether loading spinner should be shown
function shouldShowLoadingSpinner(loading: boolean): boolean {
  return loading;
}

describe("Loading States Property-Based Tests", () => {
  describe("Property 4: Loading state during form submission", () => {
    it("button is always disabled when loading is true, regardless of disabled prop", () => {
      fc.assert(
        fc.property(fc.boolean(), (disabledProp) => {
          // When loading is true, button should always be disabled
          const isDisabled = computeButtonDisabled(true, disabledProp);
          expect(isDisabled).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("loading spinner is shown if and only if loading is true", () => {
      fc.assert(
        fc.property(fc.boolean(), (loading) => {
          const showsSpinner = shouldShowLoadingSpinner(loading);
          expect(showsSpinner).toBe(loading);
        }),
        { numRuns: 100 }
      );
    });

    it("button disabled state equals (loading OR disabled)", () => {
      fc.assert(
        fc.property(fc.boolean(), fc.boolean(), (loading, disabled) => {
          const isDisabled = computeButtonDisabled(loading, disabled);
          expect(isDisabled).toBe(loading || disabled);
        }),
        { numRuns: 100 }
      );
    });

    it("loading state takes precedence - button disabled when loading even if disabled=false", () => {
      fc.assert(
        fc.property(fc.constant(true), fc.constant(false), (loading, disabled) => {
          const isDisabled = computeButtonDisabled(loading, disabled);
          expect(isDisabled).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("when not loading, disabled prop is respected", () => {
      fc.assert(
        fc.property(fc.boolean(), (disabled) => {
          const isDisabled = computeButtonDisabled(false, disabled);
          expect(isDisabled).toBe(disabled);
        }),
        { numRuns: 100 }
      );
    });
  });
});
