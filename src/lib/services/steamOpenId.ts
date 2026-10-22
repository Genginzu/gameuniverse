/**
 * Steam OpenID 2.0 assertion checks.
 *
 * `check_authentication` only proves that Steam signed the fields; it does not
 * prove the assertion was issued for this site and this login flow. An
 * attacker running any "Sign in through Steam" site can replay a victim's
 * assertion here. So the signed `openid.return_to` must be exactly our callback
 * URL carrying the state stored in the caller's cookie.
 */

export const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const STEAM_ID_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;
const REQUIRED_SIGNED = ["op_endpoint", "claimed_id", "identity", "return_to", "response_nonce"];

/** Returns the SteamID when the assertion is well-formed and bound to this flow, else null. */
export function parseSteamAssertion(
  params: URLSearchParams,
  expectedReturnTo: string
): { steamId: string; verifyBody: URLSearchParams } | null {
  const openidKeys = [...new Set([...params.keys()].filter((key) => key.startsWith("openid.")))];
  if (openidKeys.some((key) => params.getAll(key).length > 1)) return null;

  if (params.get("openid.ns") !== OPENID_NS) return null;
  if (params.get("openid.mode") !== "id_res") return null;
  if (params.get("openid.op_endpoint") !== STEAM_OPENID_URL) return null;
  if (params.get("openid.return_to") !== expectedReturnTo) return null;

  const claimedId = params.get("openid.claimed_id") ?? "";
  if (claimedId !== params.get("openid.identity")) return null;

  const signed = (params.get("openid.signed") ?? "").split(",");
  if (!REQUIRED_SIGNED.every((field) => signed.includes(field))) return null;

  const match = claimedId.match(STEAM_ID_REGEX);
  if (!match) return null;

  const verifyBody = new URLSearchParams();
  for (const key of openidKeys) verifyBody.set(key, params.get(key) ?? "");
  verifyBody.set("openid.mode", "check_authentication");

  return { steamId: match[1], verifyBody };
}

/** Steam answers a key-value body; require an exact `is_valid:true` line. */
export function isValidSteamVerification(responseText: string): boolean {
  return responseText.split("\n").some((line) => line.trim() === "is_valid:true");
}
