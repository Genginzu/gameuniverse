// Configuration Bun optimisée pour Game Universe
import type { BunPlugin } from "bun";

export default {
  test: {
    // Configuration pour les tests avec Bun
    preload: ["./test/setup.ts"],
    timeout: 30000,
    coverage: {
      enabled: true,
      reporter: ["text", "html", "json"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "coverage/**",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        "dist/**",
        "out/**",
      ],
      threshold: {
        line: 80,
        function: 80,
        branch: 70,
        statement: 80,
      },
    },
    // Support pour les tests de propriété avec fast-check
    setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  },
  build: {
    // Configuration pour le build avec Bun
    target: "browser",
    minify: {
      whitespace: true,
      identifiers: true,
      syntax: true,
    },
    sourcemap: "external",
    splitting: true,
    outdir: "./dist",
    entrypoints: ["./src/index.ts"],
    // Optimisations pour Next.js
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    },
    external: ["react", "react-dom", "next"],
  },
  // Configuration pour le développement
  dev: {
    port: 3000,
    hostname: "localhost",
    // Optimisations pour le hot reload
    hot: true,
    watch: {
      paths: ["./src/**/*", "./app/**/*", "./components/**/*"],
      ignore: ["node_modules", ".next", "dist", "coverage"],
    },
  },
  // Configuration pour l'installation des packages
  install: {
    exact: true,
    auto: true,
    cache: true,
    registry: "https://registry.npmjs.org/",
  },
} satisfies {
  test: any;
  build: any;
  dev: any;
  install: any;
};
