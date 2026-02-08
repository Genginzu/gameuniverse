import { describe, it, expect } from "bun:test";
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

describe("Form components", () => {
  describe("exports", () => {
    it("should export Form component", () => {
      expect(Form).toBeDefined();
    });

    it("should export FormItem component", () => {
      expect(FormItem).toBeDefined();
    });

    it("should export FormLabel component", () => {
      expect(FormLabel).toBeDefined();
    });

    it("should export FormControl component", () => {
      expect(FormControl).toBeDefined();
    });

    it("should export FormDescription component", () => {
      expect(FormDescription).toBeDefined();
    });

    it("should export FormMessage component", () => {
      expect(FormMessage).toBeDefined();
    });

    it("should export FormField component", () => {
      expect(FormField).toBeDefined();
    });

    it("should export useFormField hook", () => {
      expect(useFormField).toBeDefined();
      expect(typeof useFormField).toBe("function");
    });
  });

  describe("component displayNames", () => {
    it("FormItem should have displayName", () => {
      expect(FormItem.displayName).toBe("FormItem");
    });

    it("FormLabel should have displayName", () => {
      expect(FormLabel.displayName).toBe("FormLabel");
    });

    it("FormControl should have displayName", () => {
      expect(FormControl.displayName).toBe("FormControl");
    });

    it("FormDescription should have displayName", () => {
      expect(FormDescription.displayName).toBe("FormDescription");
    });

    it("FormMessage should have displayName", () => {
      expect(FormMessage.displayName).toBe("FormMessage");
    });
  });

  describe("component types", () => {
    it("FormItem should be a forwardRef component", () => {
      expect(FormItem).toHaveProperty("$$typeof");
    });

    it("FormLabel should be a forwardRef component", () => {
      expect(FormLabel).toHaveProperty("$$typeof");
    });

    it("FormControl should be a forwardRef component", () => {
      expect(FormControl).toHaveProperty("$$typeof");
    });

    it("FormDescription should be a forwardRef component", () => {
      expect(FormDescription).toHaveProperty("$$typeof");
    });

    it("FormMessage should be a forwardRef component", () => {
      expect(FormMessage).toHaveProperty("$$typeof");
    });
  });
});
