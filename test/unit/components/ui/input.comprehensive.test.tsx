import { describe, it, expect } from "bun:test";
import { renderToString } from "react-dom/server";
import { Input } from "../../../../src/components/ui/input";

describe("Input component rendering", () => {
  describe("basic rendering", () => {
    it("should render an input element", () => {
      const html = renderToString(<Input />);
      expect(html).toContain("<input");
    });

    it("should apply default classes", () => {
      const html = renderToString(<Input />);
      expect(html).toContain("flex");
      expect(html).toContain("h-10");
      expect(html).toContain("w-full");
      expect(html).toContain("rounded-xl");
      expect(html).toContain("border");
    });
  });

  describe("type prop", () => {
    it("should render text input by default", () => {
      const html = renderToString(<Input />);
      // Default type is text (or undefined which browsers treat as text)
      expect(html).toContain("<input");
    });

    it("should render email input", () => {
      const html = renderToString(<Input type="email" />);
      expect(html).toContain('type="email"');
    });

    it("should render password input", () => {
      const html = renderToString(<Input type="password" />);
      expect(html).toContain('type="password"');
    });

    it("should render number input", () => {
      const html = renderToString(<Input type="number" />);
      expect(html).toContain('type="number"');
    });

    it("should render search input", () => {
      const html = renderToString(<Input type="search" />);
      expect(html).toContain('type="search"');
    });

    it("should render tel input", () => {
      const html = renderToString(<Input type="tel" />);
      expect(html).toContain('type="tel"');
    });

    it("should render url input", () => {
      const html = renderToString(<Input type="url" />);
      expect(html).toContain('type="url"');
    });
  });

  describe("className prop", () => {
    it("should merge custom className with default classes", () => {
      const html = renderToString(<Input className="custom-class" />);
      expect(html).toContain("custom-class");
      expect(html).toContain("flex");
    });
  });

  describe("HTML attributes", () => {
    it("should pass through placeholder", () => {
      const html = renderToString(<Input placeholder="Enter text..." />);
      expect(html).toContain('placeholder="Enter text..."');
    });

    it("should pass through disabled attribute", () => {
      const html = renderToString(<Input disabled />);
      expect(html).toContain("disabled");
    });

    it("should pass through required attribute", () => {
      const html = renderToString(<Input required />);
      expect(html).toContain("required");
    });

    it("should pass through name attribute", () => {
      const html = renderToString(<Input name="username" />);
      expect(html).toContain('name="username"');
    });

    it("should pass through id attribute", () => {
      const html = renderToString(<Input id="my-input" />);
      expect(html).toContain('id="my-input"');
    });

    it("should pass through value attribute", () => {
      const html = renderToString(<Input defaultValue="test value" />);
      expect(html).toContain('value="test value"');
    });

    it("should pass through maxLength attribute", () => {
      const html = renderToString(<Input maxLength={100} />);
      // React uses camelCase for attributes in SSR
      expect(html).toContain('maxLength="100"');
    });

    it("should pass through minLength attribute", () => {
      const html = renderToString(<Input minLength={5} />);
      // React uses camelCase for attributes in SSR
      expect(html).toContain('minLength="5"');
    });

    it("should pass through aria-label", () => {
      const html = renderToString(<Input aria-label="Search input" />);
      expect(html).toContain('aria-label="Search input"');
    });

    it("should pass through data-testid", () => {
      const html = renderToString(<Input data-testid="test-input" />);
      expect(html).toContain('data-testid="test-input"');
    });
  });
});
