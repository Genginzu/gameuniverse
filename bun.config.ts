// Configuration Bun pour les tests et le build
export default {
  test: {
    // Configuration pour les tests avec Bun
    preload: ["./test/setup.ts"],
    timeout: 30000,
    coverage: {
      enabled: true,
      reporter: ["text", "html", "json"],
      exclude: ["node_modules/**", ".next/**", "coverage/**", "**/*.config.{js,ts}", "**/*.d.ts"],
    },
  },
  build: {
    // Configuration pour le build avec Bun
    target: "browser",
    minify: true,
    sourcemap: "external",
    splitting: true,
    outdir: "./dist",
    entrypoints: ["./src/index.ts"],
  },
  // Configuration pour le développement
  dev: {
    port: 3000,
    hostname: "localhost",
  },
};
