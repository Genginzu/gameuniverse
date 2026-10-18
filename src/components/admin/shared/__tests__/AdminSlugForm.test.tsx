import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm, type UseFormReturn, type FieldValues } from "react-hook-form";
import { AdminSlugForm } from "../AdminSlugForm";
import type { TranslationFieldConfig } from "../AdminTranslationFields";
import type { SupportedLanguage } from "@/types/admin-languages";

const LANGUAGES: SupportedLanguage[] = [
  { code: "fr", name: "French", native_name: "Français" },
  { code: "en", name: "English", native_name: null },
] as SupportedLanguage[];

const NAME_ONLY: TranslationFieldConfig[] = [{ name: "name", type: "input" }];
const NAME_AND_DESCRIPTION: TranslationFieldConfig[] = [
  { name: "name", type: "input" },
  { name: "description", type: "textarea" },
];

interface HarnessOptions {
  mode?: "create" | "edit";
  translations?: Array<Record<string, string>>;
  languages?: SupportedLanguage[];
  fields?: TranslationFieldConfig[];
  isSubmitting?: boolean;
}

function renderForm(options: HarnessOptions = {}) {
  const formRef: { current: UseFormReturn<FieldValues> | null } = { current: null };

  function Harness() {
    const form = useForm<FieldValues>({
      defaultValues: { slug: "sample", translations: options.translations ?? [] },
    });
    formRef.current = form;
    return (
      <AdminSlugForm
        mode={options.mode ?? "create"}
        form={form}
        onSubmit={vi.fn()}
        isSubmitting={options.isSubmitting ?? false}
        supportedLanguages={options.languages ?? LANGUAGES}
        translationNamespace="admin.test.form"
        translationFields={options.fields ?? NAME_ONLY}
      />
    );
  }

  render(<Harness />);
  return () => formRef.current!.getValues("translations");
}

describe("AdminSlugForm", () => {
  it("keeps the slug editable in create mode and shows the create label", () => {
    renderForm({ mode: "create" });
    expect(screen.getByRole("textbox", { name: "slug" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "create" })).toBeInTheDocument();
  });

  it("locks the slug in edit mode and shows the save label", () => {
    renderForm({ mode: "edit" });
    expect(screen.getByRole("textbox", { name: "slug" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "save" })).toBeInTheDocument();
  });

  it("renders one translation card per supported language", () => {
    renderForm();
    expect(screen.getByText("Français (fr)")).toBeInTheDocument();
    expect(screen.getByText("English (en)")).toBeInTheDocument();
  });

  describe("translation sync", () => {
    it("creates empty translations with only the configured fields", () => {
      const getTranslations = renderForm({ fields: NAME_ONLY });
      expect(getTranslations()).toEqual([
        { language_code: "fr", name: "" },
        { language_code: "en", name: "" },
      ]);
    });

    it("includes every configured field in the defaults", () => {
      const getTranslations = renderForm({ fields: NAME_AND_DESCRIPTION });
      expect(getTranslations()).toEqual([
        { language_code: "fr", name: "", description: "" },
        { language_code: "en", name: "", description: "" },
      ]);
    });

    it("preserves existing translations and fills missing languages", () => {
      const getTranslations = renderForm({
        translations: [{ language_code: "fr", name: "Masculin" }],
      });
      expect(getTranslations()).toEqual([
        { language_code: "fr", name: "Masculin" },
        { language_code: "en", name: "" },
      ]);
    });

    it("replaces unsupported languages even when the count is unchanged", () => {
      const getTranslations = renderForm({
        translations: [
          { language_code: "fr", name: "Masculin" },
          { language_code: "de", name: "Männlich" },
        ],
      });
      expect(getTranslations()).toEqual([
        { language_code: "fr", name: "Masculin" },
        { language_code: "en", name: "" },
      ]);
    });

    it("reorders translations to match the supported languages order", () => {
      const getTranslations = renderForm({
        translations: [
          { language_code: "en", name: "Male" },
          { language_code: "fr", name: "Masculin" },
        ],
      });
      expect(getTranslations()).toEqual([
        { language_code: "fr", name: "Masculin" },
        { language_code: "en", name: "Male" },
      ]);
    });

    it("leaves translations untouched when no languages are loaded yet", () => {
      const getTranslations = renderForm({
        languages: [],
        translations: [{ language_code: "fr", name: "Test" }],
      });
      expect(getTranslations()).toEqual([{ language_code: "fr", name: "Test" }]);
    });
  });
});
