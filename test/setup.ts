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

// Add missing DOM globals
global.DocumentFragment = dom.window.DocumentFragment;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLSpanElement = dom.window.HTMLSpanElement;
global.HTMLFormElement = dom.window.HTMLFormElement;
global.Node = dom.window.Node;
global.Text = dom.window.Text;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.CustomEvent = dom.window.CustomEvent;
global.MutationObserver = dom.window.MutationObserver;
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

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
