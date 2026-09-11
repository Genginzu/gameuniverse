import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TranslationReviewModal } from "@/components/admin/translations/TranslationReviewModal";
import {
  EDITABLE_FIELDS,
  type TranslationMissingItem,
  type EntityType,
} from "@/types/admin-translations";

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Helpers ────────────────────────────────────────────────────────

function makeItem(overrides?: Partial<TranslationMissingItem>): TranslationMissingItem {
  return {
    entityId: "uuid-1",
    identifier: "test-slug",
    sourceText: { title: "Source Title", description: "Source Description" },
    sourceLang: "en",
    missingLangs: ["fr"],
    ...overrides,
  };
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  item: makeItem(),
  translatedFields: { title: "Titre traduit", description: "Description traduite" },
  entityType: "games" as EntityType,
  targetLang: "fr",
  onSave: vi.fn().mockResolvedValue(undefined),
  isSaving: false,
};

// ─── Tests ──────────────────────────────────────────────────────────

describe("TranslationReviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(<TranslationReviewModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the modal with title when isOpen is true", () => {
    render(<TranslationReviewModal {...defaultProps} />);
    expect(screen.getByText("review.title")).toBeInTheDocument();
  });

  it("renders editable fields matching EDITABLE_FIELDS for games", () => {
    render(<TranslationReviewModal {...defaultProps} />);
    const fields = EDITABLE_FIELDS["games"];
    for (const field of fields) {
      // Each field appears twice: source label + target label
      const labels = screen.getAllByText(new RegExp(`^${field} —`));
      expect(labels.length).toBe(2);
    }
  });

  it("renders editable fields matching EDITABLE_FIELDS for characters", () => {
    const item = makeItem({
      sourceText: { name: "Mario", description: "A plumber", biography: "Long bio text" },
    });
    render(
      <TranslationReviewModal
        {...defaultProps}
        item={item}
        entityType="characters"
        translatedFields={{ name: "Mario FR", description: "Un plombier", biography: "Bio longue" }}
      />
    );
    const fields = EDITABLE_FIELDS["characters"];
    for (const field of fields) {
      const labels = screen.getAllByText(new RegExp(`^${field} —`));
      expect(labels.length).toBe(2);
    }
  });

  it("displays source text as read-only", () => {
    render(<TranslationReviewModal {...defaultProps} />);
    const sourceInputs = screen.getAllByDisplayValue("Source Title");
    expect(sourceInputs[0]).toHaveAttribute("readonly");
  });

  it("displays translated text in editable fields", () => {
    render(<TranslationReviewModal {...defaultProps} />);
    const editableInput = screen.getByDisplayValue("Titre traduit");
    expect(editableInput).not.toHaveAttribute("readonly");
  });

  it("calls onClose when cancel button is clicked", () => {
    render(<TranslationReviewModal {...defaultProps} />);
    fireEvent.click(screen.getByText("buttons.cancel"));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when clicking the backdrop", () => {
    const { container } = render(<TranslationReviewModal {...defaultProps} />);
    // The backdrop is the outermost fixed div
    const backdrop = container.querySelector(".fixed");
    fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("does not close when clicking inside the modal panel", () => {
    render(<TranslationReviewModal {...defaultProps} />);
    fireEvent.click(screen.getByText("review.title"));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("calls onSave with form data on submit", async () => {
    const propsWithStoryline = {
      ...defaultProps,
      translatedFields: {
        title: "Titre traduit",
        description: "Description traduite",
        storyline: "Résumé de l'histoire",
      },
    };
    render(<TranslationReviewModal {...propsWithStoryline} />);
    fireEvent.click(screen.getByText("buttons.save"));
    await waitFor(() => {
      expect(propsWithStoryline.onSave).toHaveBeenCalledWith({
        title: "Titre traduit",
        description: "Description traduite",
        storyline: "Résumé de l'histoire",
      });
    });
  });

  it("shows validation errors when fields are empty", async () => {
    render(
      <TranslationReviewModal {...defaultProps} translatedFields={{ title: "", description: "" }} />
    );
    fireEvent.click(screen.getByText("buttons.save"));
    await waitFor(() => {
      const errors = screen.getAllByText("review.fieldRequired");
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it("disables buttons when isSaving is true", () => {
    render(<TranslationReviewModal {...defaultProps} isSaving={true} />);
    const saveBtn = screen.getByText("buttons.save").closest("button");
    const cancelBtn = screen.getByText("buttons.cancel").closest("button");
    expect(saveBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });

  it("shows saving state when isSaving", () => {
    render(<TranslationReviewModal {...defaultProps} isSaving={true} />);
    const saveBtn = screen.getByText("buttons.save").closest("button");
    // Save button is disabled during saving
    expect(saveBtn).toBeDisabled();
  });

  it("displays entity identifier and metadata", () => {
    render(<TranslationReviewModal {...defaultProps} />);
    expect(screen.getByText(/test-slug/)).toBeInTheDocument();
  });
});
