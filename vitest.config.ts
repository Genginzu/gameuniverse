import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Two-project setup: "node" for pure logic tests (no jsdom overhead),
 * "dom" for tests that need a browser environment (React rendering, hooks).
 */

// Hook tests that use renderHook from @testing-library/react
const HOOK_TESTS_NEEDING_DOM = [
  "test/unit/hooks/useAdminCharacters.test.ts",
  "test/unit/hooks/useAdminCompanies.test.ts",
  "test/unit/hooks/useAdminGenres.test.ts",
  "test/unit/hooks/useAdminLanguages.test.ts",
  "test/unit/hooks/useCharacterForm.test.ts",
  "test/unit/hooks/useCollectionDetail.test.ts",
  "test/unit/hooks/useCollections.test.ts",
  "test/unit/hooks/useCompanyForm.test.ts",
  "test/unit/hooks/useGenreForm.test.ts",
  "test/unit/hooks/useLanguageForm.test.ts",
  "test/unit/hooks/useProfile.test.ts",
  "test/unit/hooks/useRecommendations.test.ts",
  "test/unit/hooks/usePersonalRecommendations.test.ts",
  "test/unit/hooks/use-toast.test.ts",
  "test/unit/hooks/usePriceHistory.test.ts",
  "test/setup.test.ts",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    css: false,
    reporters: ["default"],
    onConsoleLog: () => false,
    server: {
      deps: {
        inline: ["zod"],
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          setupFiles: ["./test/setup-vitest.ts"],
          include: ["test/**/*.test.tsx", ...HOOK_TESTS_NEEDING_DOM],
        },
      },
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["test/**/*.test.ts"],
          exclude: HOOK_TESTS_NEEDING_DOM,
        },
      },
    ],
  },
});
