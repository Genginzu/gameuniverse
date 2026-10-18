import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { consumeOauthState } from "@/lib/services/oauthState";
import type {
  ConnectionFailureReason,
  ConnectionOutcome,
  PlatformConnectionAdapter,
} from "@/types/platform-connection";
import { PlatformConnectionError, toConnectionError } from "./errors";
import { buildLinkedPlatformRow, persistLinkedPlatform } from "./persistLinkedPlatform";

export interface ConnectPlatformParams {
  adapter: PlatformConnectionAdapter;
  supabase: SupabaseClient<Database>;
  fields: URLSearchParams;
  redirectUri: string;
}

async function runStep<T>(fallback: ConnectionFailureReason, step: () => Promise<T>): Promise<T> {
  try {
    return await step();
  } catch (error) {
    throw toConnectionError(error, fallback);
  }
}

async function linkPlatform(
  { adapter, supabase, fields, redirectUri }: ConnectPlatformParams,
  playerId: string
): Promise<ConnectionOutcome> {
  if (adapter.usesState && !(await consumeOauthState(adapter.provider, fields.get("state")))) {
    throw new PlatformConnectionError("state_mismatch");
  }

  const grant = fields.get(adapter.grantField)?.trim();
  if (!grant) throw new PlatformConnectionError("no_code");

  const input = { fields, redirectUri };
  const credentials = await runStep("token_failed", () => adapter.obtainCredentials(grant, input));
  const profile = await runStep("profile_failed", () => adapter.readProfile(credentials, input));

  const writeError = await persistLinkedPlatform(
    supabase,
    buildLinkedPlatformRow(playerId, adapter, credentials, profile)
  );
  if (writeError)
    throw new PlatformConnectionError("persist_failed", undefined, writeError.message);

  return { status: "linked", playerId, profile };
}

export async function connectPlatform(params: ConnectPlatformParams): Promise<ConnectionOutcome> {
  const {
    data: { user },
  } = await params.supabase.auth.getUser();
  if (!user) return { status: "unauthorized" };

  try {
    return await linkPlatform(params, user.id);
  } catch (error) {
    const failure = toConnectionError(error, "unexpected");
    logger.error("Platform connection failed", {
      provider: params.adapter.provider,
      playerId: user.id,
      reason: failure.reason,
      error,
    });
    return {
      status: "failed",
      playerId: user.id,
      reason: failure.reason,
      detail: failure.detail,
      message: failure.message,
    };
  }
}
