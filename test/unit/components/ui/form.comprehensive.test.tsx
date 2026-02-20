import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";

// vi.hoisted ensures mock fns are available when vi.mock factories run
const { mockGetFieldState, mockUseFormContext } = vi.hoisted(() => {
  const mockFormState = {
    errors: {},
    isDirty: false,
    isSubmitting: false,
    isValid: true,
    touchedFields: {},
    dirtyFields: {},
    isSubmitted: false,
    isSubmitSuccessful: false,
    submitCount: 0,
    isLoading: false,
    isValidating: false,
    defaultValues: {},
  };

  const mockGetFieldState = vi.fn(() => ({
    invalid: false,
    isDirty: false,
    isTouched: false,
    isValidating: false,
    error: undefined,
  }));

  const mockUseFormContext = vi.fn(() => ({
    getFieldState: mockGetFieldState,
    formState: mockFormState,
    register: vi.fn(() => ({})),
    handleSubmit: vi.fn(() => () => {}),
    watch: vi.fn(() => undefined),
    setValue: vi.fn(() => {}),
    getValues: vi.fn(() => ({})),
    reset: vi.fn(() => {}),
    clearErrors: vi.fn(() => {}),
    setError: vi.fn(() => {}),
    trigger: vi.fn(() => Promise.resolve(true)),
    control: {},
  }));

  return { mockGetFieldState, mockUseFormContext };
});

vi.mock("react-hook-form", () => ({
  useFormContext: mockUseFormContext,
  FormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Controller: ({ render, name }: { render: (props: any) => React.ReactNode; name: string }) =>
    render({
      field: { name, value: "", onChange: () => {}, onBlur: () => {}, ref: () => {} },
      fieldState: { invalid: false, isTouched: false, isDirty: false, error: undefined },
      formState: {
        errors: {},
        isDirty: false,
        isSubmitting: false,
        isValid: true,
        touchedFields: {},
        dirtyFields: {},
        isSubmitted: false,
        isSubmitSuccessful: false,
        submitCount: 0,
        isLoading: false,
        isValidating: false,
        defaultValues: {},
      },
    }),
}));

// Import after mocking
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
} from "../../../../src/components/ui/form";

describe("Form components comprehensive tests", () => {
  describe("Form component", () => {
    it("should export Form as FormProvider", () => {
      expect(Form).toBeDefined();
    });
  });

  describe("FormItem component", () => {
    it("should render a div with space-y-2 class", () => {
      const html = renderToString(
        <FormItem>
          <span>Content</span>
        </FormItem>
      );
      expect(html).toContain("<div");
      expect(html).toContain("space-y-2");
      expect(html).toContain("Content");
    });

    it("should merge custom className", () => {
      const html = renderToString(
        <FormItem className="my-custom-class">
          <span>Content</span>
        </FormItem>
      );
      expect(html).toContain("my-custom-class");
      expect(html).toContain("space-y-2");
    });

    it("should have displayName", () => {
      expect(FormItem.displayName).toBe("FormItem");
    });
  });

  describe("FormField component", () => {
    it("should render Controller with context provider", () => {
      const html = renderToString(
        <FormField name="test" render={({ field }) => <input {...field} />} />
      );
      expect(html).toContain("<input");
    });
  });

  describe("useFormField hook", () => {
    it("should be a function", () => {
      expect(typeof useFormField).toBe("function");
    });

    it("should throw error when used outside FormField", () => {
      expect(() => {
        const TestComponent = () => {
          useFormField();
          return null;
        };
        renderToString(<TestComponent />);
      }).toThrow("useFormField should be used within <FormField>");
    });
  });

  describe("FormLabel component", () => {
    it("should have displayName", () => {
      expect(FormLabel.displayName).toBe("FormLabel");
    });

    it("should be defined", () => {
      expect(FormLabel).toBeDefined();
    });
  });

  describe("FormControl component", () => {
    it("should have displayName", () => {
      expect(FormControl.displayName).toBe("FormControl");
    });

    it("should be defined", () => {
      expect(FormControl).toBeDefined();
    });
  });

  describe("FormDescription component", () => {
    it("should have displayName", () => {
      expect(FormDescription.displayName).toBe("FormDescription");
    });

    it("should be defined", () => {
      expect(FormDescription).toBeDefined();
    });
  });

  describe("FormMessage component", () => {
    it("should have displayName", () => {
      expect(FormMessage.displayName).toBe("FormMessage");
    });

    it("should be defined", () => {
      expect(FormMessage).toBeDefined();
    });
  });
});
