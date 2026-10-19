import { describe, it, expect } from "vitest";
import {
  STEAM_OPENID_URL,
  isValidSteamVerification,
  parseSteamAssertion,
  steamReturnUrl,
} from "@/lib/services/steamOpenId";

const BASE = "https://gameuniverse.example";
const STATE = "abcDEF123_-xyz";
const STEAM_ID = "76561198000000001";
const CLAIMED = `https://steamcommunity.com/openid/id/${STEAM_ID}`;

function assertion(overrides: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams({
    state: STATE,
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "id_res",
    "openid.op_endpoint": STEAM_OPENID_URL,
    "openid.claimed_id": CLAIMED,
    "openid.identity": CLAIMED,
    "openid.return_to": steamReturnUrl(BASE, STATE),
    "openid.response_nonce": "2026-10-19T10:00:00Zabc",
    "openid.assoc_handle": "1234567890",
    "openid.signed": "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
    "openid.sig": "c2lnbmF0dXJl",
    ...overrides,
  });
}

describe("parseSteamAssertion", () => {
  it("accepts an assertion bound to our callback and state", () => {
    const parsed = parseSteamAssertion(assertion(), steamReturnUrl(BASE, STATE));

    expect(parsed?.steamId).toBe(STEAM_ID);
    expect(parsed?.verifyBody.get("openid.mode")).toBe("check_authentication");
    expect(parsed?.verifyBody.has("state")).toBe(false);
  });

  it("rejects an assertion issued for another site (replayed return_to)", () => {
    const replayed = assertion({ "openid.return_to": "https://attacker.example/steam/return" });

    expect(parseSteamAssertion(replayed, steamReturnUrl(BASE, STATE))).toBeNull();
  });

  it("rejects an assertion bound to another state", () => {
    expect(parseSteamAssertion(assertion(), steamReturnUrl(BASE, "other-state"))).toBeNull();
  });

  it.each([
    ["op_endpoint", { "openid.op_endpoint": "https://evil.example/openid/login" }],
    ["mode", { "openid.mode": "cancel" }],
    ["identity mismatch", { "openid.identity": "https://steamcommunity.com/openid/id/76561198000000002" }],
    ["unsigned return_to", { "openid.signed": "op_endpoint,claimed_id,identity,response_nonce" }],
    ["claimed_id host", { "openid.claimed_id": "https://evil.example/openid/id/76561198000000001", "openid.identity": "https://evil.example/openid/id/76561198000000001" }],
  ])("rejects a tampered %s", (_label, overrides) => {
    expect(parseSteamAssertion(assertion(overrides), steamReturnUrl(BASE, STATE))).toBeNull();
  });

  it("rejects duplicated openid parameters", () => {
    const params = assertion();
    params.append("openid.claimed_id", "https://steamcommunity.com/openid/id/76561198000000002");

    expect(parseSteamAssertion(params, steamReturnUrl(BASE, STATE))).toBeNull();
  });
});

describe("isValidSteamVerification", () => {
  it("requires an exact is_valid:true line", () => {
    expect(isValidSteamVerification("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n")).toBe(true);
    expect(isValidSteamVerification("ns:x\nis_valid:false\nnote:is_valid:true")).toBe(false);
  });
});
