// Test setup file for Bun
// This file is loaded before all tests

import "@testing-library/jest-dom";

// Setup DOM environment for React components testing
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
  resources: "usable",
});

global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock Next.js router for testing
const mockRouter = {
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: "/",
  query: {},
  asPath: "/",
  route: "/",
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
};

// Make router available globally for tests
(global as typeof globalThis & { mockRouter: typeof mockRouter }).mockRouter = mockRouter;

// Add any other global test setup here
console.warn("Test setup completed with Bun runtime");
