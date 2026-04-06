import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";

vi.mock("@/lib/services/commentService", () => ({
  CommentService: {
    fetchComments: vi.fn(),
    submitComment: vi.fn(),
    updateComment: vi.fn(),
  },
}));

import { useComments } from "@/hooks/useComments";
import { CommentService } from "@/lib/services/commentService";

const mockedFetchComments = CommentService.fetchComments as ReturnType<typeof vi.fn>;
const mockedSubmitComment = CommentService.submitComment as ReturnType<typeof vi.fn>;

const MOCK_RESPONSE = {
  comments: [{ id: "c1", content: "Nice character" }],
  totalCount: 1,
  userHasCommented: false,
  userComment: null,
};

describe("useComments", () => {
  beforeEach(() => {
    mockedFetchComments.mockReset();
    mockedSubmitComment.mockReset();
    mockedFetchComments.mockResolvedValue(MOCK_RESPONSE);
  });

  it("returns loading initially", () => {
    const { result } = renderHook(() => useComments("char-1"), {
      wrapper: createSWRWrapper(),
    });
    expect(result.current.loading).toBe(true);
  });

  it("returns comments data after fetch", async () => {
    const { result } = renderHook(() => useComments("char-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.comments).toEqual(MOCK_RESPONSE.comments);
    expect(result.current.totalCount).toBe(1);
  });

  it("submitComment calls service and returns true on success", async () => {
    mockedSubmitComment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useComments("char-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.submitComment({ content: "Great!" } as any);
    });

    expect(success!).toBe(true);
    expect(mockedSubmitComment).toHaveBeenCalledWith("char-1", { content: "Great!" });
  });

  it("submitComment returns false and sets error on failure", async () => {
    mockedSubmitComment.mockRejectedValue(new Error("Submit failed"));

    const { result } = renderHook(() => useComments("char-1"), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.submitComment({ content: "Oops" } as any);
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe("Submit failed");
  });
});
