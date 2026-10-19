import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLookup } = vi.hoisted(() => ({ mockLookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mockLookup }));

import { isPrivateAddress, isPublicHttpsUrl } from "@/lib/utils/publicUrl";

beforeEach(() => {
  mockLookup.mockReset();
});

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.20.0.5",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ])("flags %s", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "142.250.74.14", "2606:4700::1111"])("allows %s", (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe("isPublicHttpsUrl", () => {
  it("accepts an HTTPS host that resolves to public addresses only", async () => {
    mockLookup.mockResolvedValue([{ address: "151.101.1.1", family: 4 }]);

    await expect(isPublicHttpsUrl("https://images.example.com/a.png")).resolves.toBe(true);
  });

  it("rejects a host resolving to an internal address (DNS pointing inside)", async () => {
    mockLookup.mockResolvedValue([
      { address: "151.101.1.1", family: 4 },
      { address: "10.0.0.7", family: 4 },
    ]);

    await expect(isPublicHttpsUrl("https://evil.example/a.png")).resolves.toBe(false);
  });

  it.each([
    "http://images.example.com/a.png",
    "https://images.example.com:8443/a.png",
    "https://localhost/a.png",
    "https://169.254.169.254/latest/meta-data/",
    "https://[::1]/a.png",
    "file:///etc/passwd",
    "not a url",
  ])("rejects %s without a DNS lookup", async (url) => {
    await expect(isPublicHttpsUrl(url)).resolves.toBe(false);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("rejects an unresolvable host", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));

    await expect(isPublicHttpsUrl("https://nowhere.invalid/a.png")).resolves.toBe(false);
  });
});
