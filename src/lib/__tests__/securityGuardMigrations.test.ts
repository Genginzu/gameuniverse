/**
 * Structural regression guards for migrations 20261018000009 to 20261018000012.
 * Vitest has no database, so these read the real migration files.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (name: string) =>
  readFileSync(join(process.cwd(), "supabase", "migrations", name), "utf8").replace(/\s+/g, " ");

const memberships = read("20261018000009_guard_group_community_memberships.sql");
const messages = read("20261018000010_guard_messages_conversations.sql");
const coachProfiles = read("20261018000011_guard_coach_profiles.sql");
const storage = read("20261018000012_scope_avatar_banner_uploads.sql");

describe("20261018000009 memberships", () => {
  it("only lets users join as plain members of public or invited groups", () => {
    expect(memberships).toContain("AND role = 'member'");
    expect(memberships).toContain("public.has_pending_group_invitation(group_id)");
    expect(memberships).toContain("AND public.is_community_public(community_id)");
  });

  it("guards role changes and removals on both membership tables", () => {
    expect(memberships).toContain("BEFORE UPDATE OR DELETE ON public.group_members");
    expect(memberships).toContain("BEFORE UPDATE OR DELETE ON public.community_members");
    expect(memberships).toContain("the owner role cannot be granted or changed");
  });
});

describe("20261018000010 messages", () => {
  it("only allows read_at to change and sets created_at server-side", () => {
    expect(messages).toContain("NEW.content IS DISTINCT FROM OLD.content");
    expect(messages).toContain("NEW.created_at := now()");
    expect(messages).toContain("NEW.participant_1 IS DISTINCT FROM OLD.participant_1");
  });
});

describe("20261018000011 coach_profiles", () => {
  it("keeps trust and Stripe fields server-only, without blocking SECURITY DEFINER aggregates", () => {
    expect(coachProfiles).toContain("current_user NOT IN ('authenticated', 'anon')");
    expect(coachProfiles).toContain("NEW.is_verified IS DISTINCT FROM OLD.is_verified");
    expect(coachProfiles).toContain("NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id");
    expect(coachProfiles).toContain("public.is_valid_cancellation_policy(NEW.cancellation_policy)");
  });
});

describe("20261018000012 storage", () => {
  it("scopes avatar and banner uploads to the uploader's folder", () => {
    const folderChecks = storage.match(/auth\.uid\(\)::text = \(storage\.foldername\(name\)\)\[1\]/g);
    expect(folderChecks).toHaveLength(2);
  });
});
