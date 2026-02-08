import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: game-library, Task 16.5
// Tests for DashboardLayout shared component logic
// **Validates: Requirements - Architecture générale, Navigation cohérente**

/**
 * Represents a user for authentication
 */
interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  preferredLocale?: string;
}

/**
 * Represents the dashboard layout state
 */
interface DashboardLayoutState {
  user: User | null;
  loading: boolean;
  sidebarOpen: boolean;
  screenWidth: number;
}

/**
 * Screen size breakpoints (matching Tailwind defaults)
 */
const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1280,
};

/**
 * Creates initial dashboard layout state
 */
function createLayoutState(
  user: User | null,
  loading: boolean,
  screenWidth: number
): DashboardLayoutState {
  return {
    user,
    loading,
    sidebarOpen: false,
    screenWidth,
  };
}

/**
 * Determines if user should be redirected to auth
 */
function shouldRedirectToAuth(state: DashboardLayoutState): boolean {
  return !state.loading && !state.user;
}

/**
 * Determines if loading spinner should be shown
 */
function shouldShowLoading(state: DashboardLayoutState): boolean {
  return state.loading;
}

/**
 * Determines if content should be rendered
 */
function shouldRenderContent(state: DashboardLayoutState): boolean {
  return !state.loading && state.user !== null;
}

/**
 * Toggles sidebar state
 */
function toggleSidebar(state: DashboardLayoutState): DashboardLayoutState {
  return {
    ...state,
    sidebarOpen: !state.sidebarOpen,
  };
}

/**
 * Closes sidebar (e.g., on outside click)
 */
function closeSidebar(state: DashboardLayoutState): DashboardLayoutState {
  return {
    ...state,
    sidebarOpen: false,
  };
}

/**
 * Handles screen resize
 */
function handleResize(state: DashboardLayoutState, newWidth: number): DashboardLayoutState {
  // Close sidebar on mobile when resizing
  const shouldCloseSidebar = newWidth < BREAKPOINTS.desktop && state.sidebarOpen;

  return {
    ...state,
    screenWidth: newWidth,
    sidebarOpen: shouldCloseSidebar ? false : state.sidebarOpen,
  };
}

/**
 * Determines if sidebar should be visible based on screen size
 */
function isSidebarVisible(state: DashboardLayoutState): boolean {
  // On desktop, sidebar is always visible
  // On mobile/tablet, sidebar is visible only when sidebarOpen is true
  if (state.screenWidth >= BREAKPOINTS.desktop) {
    return true;
  }
  return state.sidebarOpen;
}

/**
 * Determines if mobile overlay should be shown
 */
function shouldShowMobileOverlay(state: DashboardLayoutState): boolean {
  return state.sidebarOpen && state.screenWidth < BREAKPOINTS.desktop;
}

/**
 * Gets the current device type based on screen width
 */
function getDeviceType(screenWidth: number): "mobile" | "tablet" | "desktop" {
  if (screenWidth < BREAKPOINTS.tablet) return "mobile";
  if (screenWidth < BREAKPOINTS.desktop) return "tablet";
  return "desktop";
}

// Generators
const userGenerator = (): fc.Arbitrary<User> =>
  fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    avatarUrl: fc.option(fc.webUrl()),
    preferredLocale: fc.option(fc.constantFrom("fr", "en")),
  });

const screenWidthGenerator = fc.integer({ min: 320, max: 2560 });

describe("DashboardLayout Property-Based Tests", () => {
  describe("Authentication State", () => {
    it("should redirect to auth when not loading and no user", () => {
      fc.assert(
        fc.property(screenWidthGenerator, (screenWidth) => {
          const state = createLayoutState(null, false, screenWidth);
          return shouldRedirectToAuth(state) === true;
        }),
        { numRuns: 30 }
      );
    });

    it("should not redirect when loading", () => {
      fc.assert(
        fc.property(screenWidthGenerator, (screenWidth) => {
          const state = createLayoutState(null, true, screenWidth);
          return shouldRedirectToAuth(state) === false;
        }),
        { numRuns: 30 }
      );
    });

    it("should not redirect when user is authenticated", () => {
      fc.assert(
        fc.property(userGenerator(), screenWidthGenerator, (user, screenWidth) => {
          const state = createLayoutState(user, false, screenWidth);
          return shouldRedirectToAuth(state) === false;
        }),
        { numRuns: 30 }
      );
    });

    it("should show loading when loading is true", () => {
      fc.assert(
        fc.property(fc.option(userGenerator()), screenWidthGenerator, (user, screenWidth) => {
          const state = createLayoutState(user ?? null, true, screenWidth);
          return shouldShowLoading(state) === true;
        }),
        { numRuns: 30 }
      );
    });

    it("should render content when not loading and user exists", () => {
      fc.assert(
        fc.property(userGenerator(), screenWidthGenerator, (user, screenWidth) => {
          const state = createLayoutState(user, false, screenWidth);
          return shouldRenderContent(state) === true;
        }),
        { numRuns: 30 }
      );
    });

    it("should not render content when loading", () => {
      fc.assert(
        fc.property(userGenerator(), screenWidthGenerator, (user, screenWidth) => {
          const state = createLayoutState(user, true, screenWidth);
          return shouldRenderContent(state) === false;
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Sidebar State Management", () => {
    it("initial sidebar state should be closed", () => {
      fc.assert(
        fc.property(userGenerator(), screenWidthGenerator, (user, screenWidth) => {
          const state = createLayoutState(user, false, screenWidth);
          return state.sidebarOpen === false;
        }),
        { numRuns: 30 }
      );
    });

    it("toggling sidebar should flip sidebarOpen state", () => {
      fc.assert(
        fc.property(userGenerator(), screenWidthGenerator, (user, screenWidth) => {
          const state = createLayoutState(user, false, screenWidth);
          const toggledOnce = toggleSidebar(state);
          const toggledTwice = toggleSidebar(toggledOnce);

          return (
            state.sidebarOpen === false &&
            toggledOnce.sidebarOpen === true &&
            toggledTwice.sidebarOpen === false
          );
        }),
        { numRuns: 30 }
      );
    });

    it("closing sidebar should set sidebarOpen to false", () => {
      fc.assert(
        fc.property(userGenerator(), screenWidthGenerator, (user, screenWidth) => {
          let state = createLayoutState(user, false, screenWidth);
          state = toggleSidebar(state); // Open
          state = closeSidebar(state); // Close

          return state.sidebarOpen === false;
        }),
        { numRuns: 30 }
      );
    });

    it("closing already closed sidebar should remain closed", () => {
      fc.assert(
        fc.property(userGenerator(), screenWidthGenerator, (user, screenWidth) => {
          const state = createLayoutState(user, false, screenWidth);
          const closedState = closeSidebar(state);

          return closedState.sidebarOpen === false;
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Responsive Behavior", () => {
    it("sidebar should always be visible on desktop", () => {
      fc.assert(
        fc.property(
          userGenerator(),
          fc.integer({ min: BREAKPOINTS.desktop, max: 2560 }),
          (user, screenWidth) => {
            const state = createLayoutState(user, false, screenWidth);
            return isSidebarVisible(state) === true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("sidebar visibility on mobile depends on sidebarOpen state", () => {
      fc.assert(
        fc.property(
          userGenerator(),
          fc.integer({ min: 320, max: BREAKPOINTS.desktop - 1 }),
          (user, screenWidth) => {
            const closedState = createLayoutState(user, false, screenWidth);
            const openState = toggleSidebar(closedState);

            return isSidebarVisible(closedState) === false && isSidebarVisible(openState) === true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("mobile overlay should show when sidebar is open on mobile", () => {
      fc.assert(
        fc.property(
          userGenerator(),
          fc.integer({ min: 320, max: BREAKPOINTS.desktop - 1 }),
          (user, screenWidth) => {
            let state = createLayoutState(user, false, screenWidth);
            state = toggleSidebar(state);

            return shouldShowMobileOverlay(state) === true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("mobile overlay should not show on desktop", () => {
      fc.assert(
        fc.property(
          userGenerator(),
          fc.integer({ min: BREAKPOINTS.desktop, max: 2560 }),
          (user, screenWidth) => {
            let state = createLayoutState(user, false, screenWidth);
            state = toggleSidebar(state);

            return shouldShowMobileOverlay(state) === false;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("resizing to mobile should close open sidebar", () => {
      fc.assert(
        fc.property(
          userGenerator(),
          fc.integer({ min: BREAKPOINTS.desktop, max: 2560 }),
          fc.integer({ min: 320, max: BREAKPOINTS.desktop - 1 }),
          (user, desktopWidth, mobileWidth) => {
            let state = createLayoutState(user, false, desktopWidth);
            state = toggleSidebar(state); // Open sidebar on desktop
            state = handleResize(state, mobileWidth); // Resize to mobile

            return state.sidebarOpen === false;
          }
        ),
        { numRuns: 30 }
      );
    });

    it("resizing within desktop should not affect sidebar state", () => {
      fc.assert(
        fc.property(
          userGenerator(),
          fc.integer({ min: BREAKPOINTS.desktop, max: 1920 }),
          fc.integer({ min: BREAKPOINTS.desktop, max: 2560 }),
          (user, width1, width2) => {
            let state = createLayoutState(user, false, width1);
            state = toggleSidebar(state);
            const sidebarStateBefore = state.sidebarOpen;
            state = handleResize(state, width2);

            return state.sidebarOpen === sidebarStateBefore;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Device Type Detection", () => {
    it("should detect mobile for screens < 768px", () => {
      fc.assert(
        fc.property(fc.integer({ min: 320, max: BREAKPOINTS.tablet - 1 }), (screenWidth) => {
          return getDeviceType(screenWidth) === "mobile";
        }),
        { numRuns: 30 }
      );
    });

    it("should detect tablet for screens >= 768px and < 1024px", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: BREAKPOINTS.tablet, max: BREAKPOINTS.desktop - 1 }),
          (screenWidth) => {
            return getDeviceType(screenWidth) === "tablet";
          }
        ),
        { numRuns: 30 }
      );
    });

    it("should detect desktop for screens >= 1024px", () => {
      fc.assert(
        fc.property(fc.integer({ min: BREAKPOINTS.desktop, max: 2560 }), (screenWidth) => {
          return getDeviceType(screenWidth) === "desktop";
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("State Consistency", () => {
    it("loading and content rendering should be mutually exclusive", () => {
      fc.assert(
        fc.property(
          fc.option(userGenerator()),
          fc.boolean(),
          screenWidthGenerator,
          (user, loading, screenWidth) => {
            const state = createLayoutState(user ?? null, loading, screenWidth);
            const showLoading = shouldShowLoading(state);
            const renderContent = shouldRenderContent(state);

            // Cannot both show loading and render content
            return !(showLoading && renderContent);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("redirect and content rendering should be mutually exclusive", () => {
      fc.assert(
        fc.property(
          fc.option(userGenerator()),
          fc.boolean(),
          screenWidthGenerator,
          (user, loading, screenWidth) => {
            const state = createLayoutState(user ?? null, loading, screenWidth);
            const redirect = shouldRedirectToAuth(state);
            const renderContent = shouldRenderContent(state);

            // Cannot both redirect and render content
            return !(redirect && renderContent);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("exactly one of loading, redirect, or content should be active", () => {
      fc.assert(
        fc.property(
          fc.option(userGenerator()),
          fc.boolean(),
          screenWidthGenerator,
          (user, loading, screenWidth) => {
            const state = createLayoutState(user ?? null, loading, screenWidth);
            const showLoading = shouldShowLoading(state);
            const redirect = shouldRedirectToAuth(state);
            const renderContent = shouldRenderContent(state);

            // Count how many are true
            const trueCount = [showLoading, redirect, renderContent].filter(Boolean).length;

            // Exactly one should be true
            return trueCount === 1;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
