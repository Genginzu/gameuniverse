import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CollectionForm } from "../CollectionForm";

// Radix Checkbox measures itself with ResizeObserver, which jsdom lacks
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function renderForm(props: Partial<Parameters<typeof CollectionForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<CollectionForm mode="create" onSubmit={onSubmit} {...props} />);
  return { onSubmit };
}

const nameInput = () => screen.getByPlaceholderText("namePlaceholder");
const descriptionInput = () => screen.getByPlaceholderText("descriptionPlaceholder");

describe("CollectionForm", () => {
  it("starts empty in create mode with a disabled submit until the form is dirty", () => {
    renderForm();
    expect(nameInput()).toHaveValue("");
    expect(descriptionInput()).toHaveValue("");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();

    fireEvent.change(nameInput(), { target: { value: "Best RPGs" } });
    expect(screen.getByRole("button", { name: "submit" })).toBeEnabled();
  });

  it("prefills edit mode and maps a null description to an empty field", () => {
    renderForm({
      mode: "edit",
      defaultValues: { name: "My List", description: null, isPublic: true },
    });
    expect(nameInput()).toHaveValue("My List");
    expect(descriptionInput()).toHaveValue("");
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("button", { name: "submitEdit" })).toBeInTheDocument();
  });

  it("submits the entered values in create mode", async () => {
    const { onSubmit } = renderForm();
    fireEvent.change(nameInput(), { target: { value: "Best RPGs" } });
    fireEvent.change(descriptionInput(), { target: { value: "My top picks" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: "Best RPGs",
      description: "My top picks",
      isPublic: false,
    });
  });

  it("blocks submission of a whitespace-only name in create mode", async () => {
    const { onSubmit } = renderForm();
    fireEvent.change(nameInput(), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => expect(nameInput()).toHaveAttribute("aria-invalid", "true"));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
