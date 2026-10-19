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

const dataExposure = read("20261018000013_restrict_personal_data_and_internal_rpcs.sql");

describe("20261018000013 personal data and internal RPCs", () => {
  it("removes the public wallet and notification-insert policies", () => {
    expect(dataExposure).toContain('DROP POLICY IF EXISTS "Anyone can view wallet balance"');
    expect(dataExposure).toContain('DROP POLICY IF EXISTS "notifications_insert"');
  });

  it("hides OAuth tokens from anon and authenticated", () => {
    expect(dataExposure).toContain("REVOKE SELECT ON public.player_linked_platforms FROM anon, authenticated");
    const grant = dataExposure.match(/GRANT SELECT \(([^)]*)\) ON public\.player_linked_platforms/);
    expect(grant?.[1]).not.toContain("access_token");
    expect(grant?.[1]).not.toContain("refresh_token");
  });

  it("scopes the feed and backlog RPCs to the caller", () => {
    expect(dataExposure).toContain("viewer_uuid IS DISTINCT FROM auth.uid()");
    expect(dataExposure).toContain("user_uuid IS DISTINCT FROM auth.uid()");
  });

  it.each([
    "pandascore_acquire_lock(interval)",
    "pandascore_release_lock(timestamptz)",
    "refresh_translation_stats()",
    "cleanup_old_igdb_webhook_events()",
    "fast_count_estimate(text)",
  ])("revokes %s from anon and authenticated", (signature) => {
    expect(dataExposure).toContain(
      `REVOKE EXECUTE ON FUNCTION public.${signature} FROM PUBLIC, anon, authenticated`
    );
  });
});

const statsPrivate = read("20261018000014_enforce_stats_private.sql");

describe("20261018000014 stats_private", () => {
  it.each([
    "public.user_library",
    "public.game_sessions",
    "public.friendships",
    "public.player_subscriptions",
  ])("guards %s SELECT with is_stats_private", (table) => {
    const policy = statsPrivate.match(new RegExp(`ON ${table.replace(".", "\\.")} FOR SELECT USING \\(([^;]*)\\);`));
    expect(policy?.[1]).toContain("public.is_stats_private(");
  });

  it("returns an empty activity page for a private player", () => {
    expect(statsPrivate).toContain("RENAME TO get_player_activity_unchecked");
    expect(statsPrivate).toContain("jsonb_build_object('events', '[]'::jsonb, 'totalCount', 0)");
  });

  it("runs the feeds with the caller's rights so RLS applies", () => {
    expect(statsPrivate).toContain(
      "ALTER FUNCTION public.get_friends_feed_unchecked(uuid, text, text, integer, integer) SECURITY INVOKER"
    );
    expect(statsPrivate).toContain(
      "ALTER FUNCTION public.get_subscribed_feed_unchecked(uuid, text, integer, integer) SECURITY INVOKER"
    );
  });
});
