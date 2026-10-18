import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Two-project setup, selected by file extension:
 * - "dom" (jsdom): `*.test.tsx` — anything that renders React or uses renderHook.
 * - "node": `*.test.ts` — pure logic, routes, services, scripts.
 * A `.ts` test can still opt into jsdom with a `// @vitest-environment jsdom` docblock.
 */
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
    exclude: ["test/e2e/**", "node_modules/**"],
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
          include: ["src/**/__tests__/*.test.tsx", "test/integration/**/*.test.tsx"],
        },
      },
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: [
            "src/**/__tests__/*.test.ts",
            "scripts/__tests__/*.test.ts",
            "test/integration/**/*.test.ts",
            "test/scripts/**/*.test.ts",
          ],
        },
      },
    ],
  },
});
