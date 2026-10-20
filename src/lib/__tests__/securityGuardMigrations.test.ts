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

const stripeEvents = read("20261018000015_stripe_webhook_events.sql");
const fantasy = read("20261018000016_lock_fantasy_writes.sql");

describe("20261018000015 Stripe webhook ledger", () => {
  it("creates a server-only event ledger keyed by the Stripe event id", () => {
    expect(stripeEvents).toContain("CREATE TABLE IF NOT EXISTS public.stripe_webhook_events ( id TEXT PRIMARY KEY");
    expect(stripeEvents).toContain("REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated");
  });
});

describe("20261018000016 fantasy", () => {
  it("forces the league budget and zero points on client-created teams", () => {
    expect(fantasy).toContain("NEW.budget_remaining := v_budget");
    expect(fantasy).toContain("NEW.total_points := 0");
  });

  it("removes client roster writes", () => {
    expect(fantasy).toContain('DROP POLICY IF EXISTS "Players can manage their team players"');
    expect(fantasy).toContain('DROP POLICY IF EXISTS "Players can delete their team players"');
  });
});

const defaultPrivileges = read("20261018000017_revoke_default_privileges.sql");
const rateLimits = read("20261018000018_rate_limits.sql");

describe("20261018000017 default privileges", () => {
  it("stops auto-granting new tables and functions to clients", () => {
    expect(defaultPrivileges).toContain("REVOKE ALL ON TABLES FROM anon, authenticated");
    expect(defaultPrivileges).toContain("REVOKE ALL ON FUNCTIONS FROM anon, authenticated");
    expect(defaultPrivileges).toContain("ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC");
  });
});

describe("20261018000018 rate limits", () => {
  it("serialises hits per key and keeps the limiter server-only", () => {
    expect(rateLimits).toContain("pg_advisory_xact_lock(hashtextextended(p_key, 0))");
    expect(rateLimits).toContain(
      "REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated"
    );
  });
});

const conversationsGuard = read("20261018000019_conversations_require_friendship.sql");

describe("20261018000019 conversations", () => {
  it("requires an accepted friendship to open a conversation", () => {
    expect(conversationsGuard).toContain("AND public.are_friends(participant_1, participant_2)");
    expect(conversationsGuard).toContain("WHERE f.status = 'accepted'");
  });

  it("keeps coaching_sessions.conversation_id server-only", () => {
    expect(conversationsGuard).toContain("NEW.conversation_id IS DISTINCT FROM OLD.conversation_id");
    expect(conversationsGuard).toContain("BEFORE UPDATE ON public.coaching_sessions");
  });
});

const socialGraph = read("20261019000001_guard_friendships_invitations_groups.sql");
const legacyRpcs = read("20261019000002_restrict_legacy_rpcs.sql");
const integrity = read("20261019000003_server_only_achievements_and_integrity.sql");
const coinRewards = read("20261019000004_atomic_coin_rewards.sql");

describe("20261019000001 social graph", () => {
  it("only lets users send pending friend requests and change their status", () => {
    expect(socialGraph).toContain("AND status = 'pending'");
    expect(socialGraph).toContain("NEW.sender_id IS DISTINCT FROM OLD.sender_id");
  });

  it("only lets the invitee accept or decline a pending, unexpired invitation", () => {
    expect(socialGraph).toContain("(to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status')");
    expect(socialGraph).toContain("OR OLD.expires_at <= now()");
  });

  it("keeps owner_id immutable on groups and communities", () => {
    expect(socialGraph).toContain("NEW.owner_id IS DISTINCT FROM OLD.owner_id");
    expect(socialGraph).toContain("BEFORE UPDATE ON public.groups");
    expect(socialGraph).toContain("BEFORE UPDATE ON public.communities");
  });
});

describe("20261019000002 legacy RPCs", () => {
  it("revokes store, cleanup, translation and view-count RPCs from clients", () => {
    for (const fn of [
      "update_store(uuid, text, text, text, boolean)",
      "create_store(text, text, text)",
      "cleanup_orphaned_prices()",
      "refresh_translation_stats_cross_lang(text, text, text, text[], text[])",
      "increment_game_view_count(uuid)",
    ]) {
      expect(legacyRpcs).toContain(`REVOKE EXECUTE ON FUNCTION public.${fn}`);
    }
  });

  it("makes library RPCs respect user_library RLS", () => {
    expect(legacyRpcs).toContain(
      "ALTER FUNCTION public.get_common_games(uuid, uuid, text, integer, integer) SECURITY INVOKER"
    );
    expect(legacyRpcs).toContain("WHERE NOT public.is_stats_private(player_id)");
  });
});

describe("20261019000003 integrity", () => {
  it("removes client writes on achievements, price history and reports", () => {
    expect(integrity).toContain("DROP POLICY IF EXISTS player_achievements_insert_own");
    expect(integrity).toContain('DROP POLICY IF EXISTS "Authenticated users can insert price history"');
    expect(integrity).toContain('DROP POLICY IF EXISTS "Users can create reports"');
  });

  it("caps self-reported game sessions and routes reactions through an RPC", () => {
    expect(integrity).toContain("NEW.ended_at - NEW.started_at > interval '24 hours'");
    expect(integrity).toContain("v_users := v_users || to_jsonb(v_uid::text)");
  });
});

describe("20261019000004 coin rewards", () => {
  it("serialises rewards per player and de-duplicates references", () => {
    expect(coinRewards).toContain("pg_advisory_xact_lock(hashtextextended('coins:' || p_player_id::text, 0))");
    expect(coinRewards).toContain("AND t.reference_id = p_reference_id");
    expect(coinRewards).toContain(
      "REVOKE EXECUTE ON FUNCTION public.award_activity_reward(uuid, text, uuid)"
    );
  });
});
