import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF guard for server-side fetches of third-party URLs (e.g. image search
 * results): only HTTPS on the default port, to a host that resolves to public
 * addresses only (no loopback, private, link-local, CGNAT or metadata ranges).
 */

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function ipv4ToNumber(ip: string): number {
  return ip.split(".").reduce((acc, part) => acc * 256 + Number(part), 0);
}

const PRIVATE_IPV4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 3],
];

function isPrivateIpv4(ip: string): boolean {
  const value = ipv4ToNumber(ip);
  return PRIVATE_IPV4_RANGES.some(([base, bits]) => {
    const size = 2 ** (32 - bits);
    const start = ipv4ToNumber(base);
    return value >= start && value < start + size;
  });
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return (
    lower === "::" ||
    lower === "::1" ||
    /^f[cd]/.test(lower) ||
    /^fe[89ab]/.test(lower) ||
    /^ff/.test(lower)
  );
}

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

/** True when the URL is HTTPS and every address of its host is public. */
export async function isPublicHttpsUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || (url.port !== "" && url.port !== "443")) return false;

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) return false;
  if (isIP(hostname)) return !isPrivateAddress(hostname);

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every(({ address }) => !isPrivateAddress(address));
  } catch {
    return false;
  }
}
