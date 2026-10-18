import type { Json } from "@/lib/database.types";
import type { ConnectedPlatform } from "./linked-platforms";

export type ConnectionProvider =
  "xbox" | "epic" | "battlenet" | "discord" | "steam" | "itch" | "psn";

export type ConnectionFailureReason =
  | "state_mismatch"
  | "no_code"
  | "auth_failed"
  | "token_failed"
  | "profile_failed"
  | "persist_failed"
  | "unexpected";

export interface PlatformCredentials {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  accountId?: string | null;
}

export interface PlatformProfile {
  externalId: string | null;
  username: string | null;
  avatarUrl?: string | null;
  metadata?: Json | null;
  region?: string | null;
}

export interface AuthorizeContext {
  state: string;
  redirectUri: string;
  baseUrl: string;
  query: URLSearchParams;
}

export interface CallbackInput {
  fields: URLSearchParams;
  redirectUri: string;
}

export interface PlatformConnectionAdapter {
  provider: ConnectionProvider;
  platform: ConnectedPlatform;
  authType: "oauth" | "npsso";
  grantField: string;
  usesState: boolean;
  defaultExpiresIn: number | null;
  buildAuthorizeUrl?(context: AuthorizeContext): Promise<string>;
  obtainCredentials(grant: string, input: CallbackInput): Promise<PlatformCredentials>;
  readProfile(credentials: PlatformCredentials, input: CallbackInput): Promise<PlatformProfile>;
  refresh?(refreshToken: string): Promise<PlatformCredentials>;
}

export type ConnectionOutcome =
  | { status: "unauthorized" }
  | { status: "linked"; playerId: string; profile: PlatformProfile }
  | {
      status: "failed";
      playerId: string;
      reason: ConnectionFailureReason;
      detail?: string;
      message?: string;
    };

export interface XboxAuthContext {
  xstsToken: string;
  userHash: string;
  xuid: string;
}
