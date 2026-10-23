import { describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useAdminDeleteFlow } from "@/hooks/useAdminDeleteFlow";

interface Row {
  slug: string;
}

function setup(
  overrides: Partial<{ remove: () => Promise<void>; usage: number | undefined }> = {}
) {
  const list = {
    remove: vi.fn(overrides.remove ?? (() => Promise.resolve())),
    checkUsage: vi.fn(() => Promise.resolve("usage" in overrides ? overrides.usage : 3)),
  };
  const onDeleted = vi.fn();
  const onError = vi.fn();
  const hook = renderHook(() => useAdminDeleteFlow<Row>(list, { onDeleted, onError }));
  return { ...hook, list, onDeleted, onError };
}

describe("useAdminDeleteFlow", () => {
  it("opens the dialog for a row and shows its usage without deleting", async () => {
    const { result, list } = setup();

    act(() => result.current.request({ slug: "rpg" }));

    expect(result.current.target).toEqual({ slug: "rpg" });
    expect(result.current.dialog.isOpen).toBe(true);
    await waitFor(() => expect(result.current.dialog.usageCount).toBe(3));
    expect(list.remove).not.toHaveBeenCalled();
  });

  it("leaves usage unknown when it cannot be read", async () => {
    const { result, list } = setup();
    list.checkUsage.mockImplementationOnce(() => Promise.reject(new Error("boom")));

    act(() => result.current.request({ slug: "rpg" }));

    await waitFor(() => expect(list.checkUsage).toHaveBeenCalled());
    expect(result.current.dialog.usageCount).toBeUndefined();
    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("deletes the target on confirm, notifies and closes", async () => {
    const { result, list, onDeleted } = setup();
    act(() => result.current.request({ slug: "rpg" }));

    await act(() => result.current.dialog.onConfirm());

    expect(list.remove).toHaveBeenCalledWith({ slug: "rpg" });
    expect(onDeleted).toHaveBeenCalledWith({ slug: "rpg" });
    expect(result.current.dialog.isOpen).toBe(false);
    expect(result.current.dialog.isDeleting).toBe(false);
  });

  it("keeps the dialog open and reports the error when the delete fails", async () => {
    const failure = new Error("Genre is in use");
    const { result, onError, onDeleted } = setup({ remove: () => Promise.reject(failure) });
    act(() => result.current.request({ slug: "rpg" }));

    await act(() => result.current.dialog.onConfirm());

    expect(onError).toHaveBeenCalledWith(failure, { slug: "rpg" });
    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.dialog.isOpen).toBe(true);
    expect(result.current.dialog.isDeleting).toBe(false);
  });

  it("ignores close requests while a delete is running", async () => {
    let finish: () => void = () => undefined;
    const { result } = setup({ remove: () => new Promise<void>((resolve) => (finish = resolve)) });
    act(() => result.current.request({ slug: "rpg" }));

    let confirming: Promise<void> = Promise.resolve();
    act(() => {
      confirming = result.current.dialog.onConfirm();
    });
    act(() => result.current.dialog.onClose());
    expect(result.current.dialog.isOpen).toBe(true);

    await act(async () => {
      finish();
      await confirming;
    });
    expect(result.current.dialog.isOpen).toBe(false);
  });
});
