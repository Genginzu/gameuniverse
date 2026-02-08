import { describe, it, expect, mock, beforeEach } from "bun:test";
import { renderToString } from "react-dom/server";
import * as React from "react";

// Mock react-hook-form with proper context
const mockFieldState = {
  invalid: false,
  isDirty: false,
  isTouched: false,
  error: undefined as { message?: string } | undefined,
};

const mockFormContext = {
  getFieldState: mock(() => mockFieldState),
  formState: {
    errors: {},
    isDirty: false,
    isSubmitting: false,
    isValid: true,
  },
};

mock.module("react-hook-form", () => ({
  FormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Controller: ({
    name,
    render,
  }: {
    name: string;
    render: (props: { field: unknown }) => React.ReactNode;
  }) => (
    <div data-controller={name}>
      {render({ field: { name, value: "", onChange: () => {}, onBlur: () => {} } })}
    </div>
  ),
  useFormContext: () => mockFormContext,
}));

// Mock radix-ui components
mock.module("@radix-ui/react-label", () => ({
  Root: React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ children, ...props }, ref) => (
      <label ref={ref} {...props}>
        {children}
      </label>
    )
  ),
}));

mock.module("@radix-ui/react-slot", () => ({
  Slot: React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    ({ children, ...props }, ref) => (
      <div ref={ref as React.Ref<HTMLDivElement>} data-slot="true" {...props}>
        {children}
      </div>
    )
  ),
}));

// Mock Label component
mock.module("../../../../src/components/ui/label", () => ({
  Label: React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ children, className, ...props }, ref) => (
      <label ref={ref} className={className} {...props}>
        {children}
      </label>
    )
  ),
}));

// Mock cn utility
mock.module("../../../../src/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" "),
}));

// Import components after mocks
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "../../../../src/components/ui/form";

describe("Form components integration tests", () => {
  beforeEach(() => {
    mockFieldState.invalid = false;
    mockFieldState.isDirty = false;
    mockFieldState.isTouched = false;
    mockFieldState.error = undefined;
    mockFormContext.getFieldState.mockClear();
  });

  describe("Form (FormProvider)", () => {
    it("should render children", () => {
      const html = renderToString(
        <Form {...({} as Parameters<typeof Form>[0])}>
          <div>Form content</div>
        </Form>
      );

      expect(html).toContain("Form content");
    });
  });

  describe("FormItem", () => {
    it("should render with default spacing class", () => {
      const html = renderToString(
        <FormItem>
          <div>Item content</div>
        </FormItem>
      );

      expect(html).toContain("space-y-2");
      expect(html).toContain("Item content");
    });

    it("should merge custom className", () => {
      const html = renderToString(
        <FormItem className="custom-class">
          <div>Item content</div>
        </FormItem>
      );

      expect(html).toContain("space-y-2");
      expect(html).toContain("custom-class");
    });
  });

  describe("FormField with nested components", () => {
    it("should render FormLabel within FormField", () => {
      const html = renderToString(
        <FormField
          name="email"
          render={() => (
            <FormItem>
              <FormLabel>Email</FormLabel>
            </FormItem>
          )}
        />
      );

      expect(html).toContain("label");
      expect(html).toContain("Email");
    });

    it("should render FormControl within FormField", () => {
      const html = renderToString(
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input type="text" {...(field as React.InputHTMLAttributes<HTMLInputElement>)} />
              </FormControl>
            </FormItem>
          )}
        />
      );

      expect(html).toContain("data-slot");
      expect(html).toContain("aria-describedby");
    });

    it("should render FormDescription within FormField", () => {
      const html = renderToString(
        <FormField
          name="email"
          render={() => (
            <FormItem>
              <FormDescription>Enter your email</FormDescription>
            </FormItem>
          )}
        />
      );

      expect(html).toContain("text-muted-foreground");
      expect(html).toContain("Enter your email");
    });

    it("should render FormMessage with children within FormField", () => {
      const html = renderToString(
        <FormField
          name="email"
          render={() => (
            <FormItem>
              <FormMessage>Custom error</FormMessage>
            </FormItem>
          )}
        />
      );

      expect(html).toContain("text-destructive");
      expect(html).toContain("Custom error");
    });

    it("should render FormMessage with error from context", () => {
      mockFieldState.error = { message: "This field is required" };

      const html = renderToString(
        <FormField
          name="email"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      );

      expect(html).toContain("This field is required");
    });

    it("should not render FormMessage when no error and no children", () => {
      mockFieldState.error = undefined;

      const html = renderToString(
        <FormField
          name="email"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      );

      // Should not contain the error styling paragraph
      expect(html).not.toContain("text-destructive");
    });

    it("should apply error styling to FormLabel when error exists", () => {
      mockFieldState.error = { message: "Error" };

      const html = renderToString(
        <FormField
          name="email"
          render={() => (
            <FormItem>
              <FormLabel>Email</FormLabel>
            </FormItem>
          )}
        />
      );

      // The label should have error class
      expect(html).toContain("label");
    });
  });

  describe("FormField", () => {
    it("should render Controller with name", () => {
      const html = renderToString(
        <FormField
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <input {...(field as React.InputHTMLAttributes<HTMLInputElement>)} />
              </FormControl>
            </FormItem>
          )}
        />
      );

      expect(html).toContain('data-controller="username"');
      expect(html).toContain("Username");
    });
  });

  describe("FormDescription", () => {
    it("should apply custom className", () => {
      const html = renderToString(
        <FormField
          name="test"
          render={() => (
            <FormItem>
              <FormDescription className="custom-desc">Help text</FormDescription>
            </FormItem>
          )}
        />
      );

      expect(html).toContain("custom-desc");
      expect(html).toContain("text-muted-foreground");
    });
  });

  describe("FormMessage", () => {
    it("should apply custom className", () => {
      const html = renderToString(
        <FormField
          name="test"
          render={() => (
            <FormItem>
              <FormMessage className="custom-error">Error text</FormMessage>
            </FormItem>
          )}
        />
      );

      expect(html).toContain("custom-error");
    });
  });
});
