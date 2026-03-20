import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
      globals: {
        // Bun globals
        Bun: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        // Node.js globals for build scripts
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // Disable base no-unused-vars in favor of TypeScript version
      "no-unused-vars": "off",

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-var-requires": "error",

      // General JavaScript rules
      "prefer-const": "error",
      "no-var": "error",
      "no-undef": "off", // TypeScript handles this
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // React/Next.js specific rules
      "react-hooks/rules-of-hooks": "off", // Will be handled by Next.js ESLint config
      "react-hooks/exhaustive-deps": "off", // Will be handled by Next.js ESLint config

      // Import rules
      "no-duplicate-imports": "error",

      // Code quality rules
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}", "test/**/*"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        // Don't use project for test files to avoid parsing errors
        project: null,
      },
      globals: {
        // Test globals for Bun test runner
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
        // fast-check globals for property-based testing
        fc: "readonly",
      },
    },
    rules: {
      // Relax some rules for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-useless-assignment": "off",
      "no-console": "off",
    },
  },
  {
    files: ["scripts/**/*.{js,ts}"],
    rules: {
      // Scripts are CLI tools where console output is expected
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["*.config.{js,ts}", "*.setup.{js,ts}"],
    rules: {
      // Allow any in config files
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  prettier, // Must be last to override other configs
  {
    ignores: [
      ".next/",
      "node_modules/",
      "out/",
      "build/",
      "dist/",
      "coverage/",
      "*.config.js",
      "*.config.ts",
      ".husky/",
      "public/",
      "test-resend.js",
      "scripts/test-igdb-age-ratings.js",
    ],
  },
];
