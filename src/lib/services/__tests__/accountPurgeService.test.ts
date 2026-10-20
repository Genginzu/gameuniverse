import { describe, it, expect, vi, beforeEach } from "vitest";

const { admin, storageBuckets, mockFetchUserEmail, mockSendEmail } = vi.hoisted(() => {
  const storageBuckets = new Map<
    string,
    { list: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }
  >();
  const profileQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  const admin = {
    profileQuery,
    from: vi.fn(() => profileQuery),
    rpc: vi.fn(),
    storage: {
      from: vi.fn((bucket: string) => {
        if (!storageBuckets.has(bucket)) {
          storageBuckets.set(bucket, {
            list: vi.fn(async () => ({ data: [], error: null })),
            remove: vi.fn(async () => ({ data: [], error: null })),
          });
        }
        return storageBuckets.get(bucket)!;
      }),
    },
  };
  return { admin, storageBuckets, mockFetchUserEmail: vi.fn(), mockSendEmail: vi.fn() };
});

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => admin }));
vi.mock("@/lib/services/userEmailsServerService", () => ({ fetchUserEmail: mockFetchUserEmail }));
vi.mock("@/lib/email", () => ({ sendEmail: mockSendEmail }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { purgeAccount } from "@/lib/services/accountPurgeService";

const SUPABASE_URL = "http://supabase.test";
const KEPT_POST_IMAGE = `${SUPABASE_URL}/storage/v1/object/public/post-images/user-1/kept.png`;

const SUMMARY = {
  anonymisedContent: 4,
  retainedCoachingSessions: 2,
  transferredGroups: 1,
  transferredCommunities: 0,
  keptImageUrls: [KEPT_POST_IMAGE],
};

beforeEach(() => {
  vi.clearAllMocks();
  storageBuckets.clear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  admin.profileQuery.select.mockReturnValue(admin.profileQuery);
  admin.profileQuery.eq.mockReturnValue(admin.profileQuery);
  admin.profileQuery.maybeSingle.mockResolvedValue({ data: { preferred_locale: "fr" } });
  admin.rpc.mockResolvedValue({ data: SUMMARY, error: null });
  mockFetchUserEmail.mockResolvedValue("player@example.com");
  mockSendEmail.mockResolvedValue({ sent: true });
});

describe("purgeAccount (final purge)", () => {
  it("runs the atomic SQL purge, removes the user's files except retained ones, then emails", async () => {
    admin.storage.from("avatars").list.mockResolvedValue({
      data: [{ name: "avatar.png" }],
      error: null,
    });
    admin.storage.from("post-images").list.mockResolvedValue({
      data: [{ name: "kept.png" }, { name: "gone.png" }],
      error: null,
    });

    const outcome = await purgeAccount("user-1");

    expect(admin.rpc).toHaveBeenCalledWith("purge_account_data", { p_user_id: "user-1" });
    expect(admin.storage.from("avatars").remove).toHaveBeenCalledWith(["user-1/avatar.png"]);
    expect(admin.storage.from("post-images").remove).toHaveBeenCalledWith(["user-1/gone.png"]);
    expect(admin.storage.from("banners").remove).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      userId: "user-1",
      ok: true,
      removedFiles: 2,
      summary: SUMMARY,
    });
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "player@example.com", subject: "Votre compte a été supprimé" })
    );
  });

  it("reads the email before the purge, since auth.users is gone afterwards", async () => {
    await purgeAccount("user-1");
    const emailOrder = mockFetchUserEmail.mock.invocationCallOrder[0];
    const rpcOrder = admin.rpc.mock.invocationCallOrder[0];
    expect(emailOrder).toBeLessThan(rpcOrder);
  });

  it("keeps files and sends nothing when the SQL purge fails", async () => {
    admin.rpc.mockResolvedValue({ data: null, error: { message: "no pending deletion" } });

    const outcome = await purgeAccount("user-1");

    expect(outcome).toEqual({ userId: "user-1", ok: false, error: "no pending deletion" });
    expect(admin.storage.from).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
