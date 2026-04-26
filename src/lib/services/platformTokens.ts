import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const raw = process.env.PLATFORM_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("PLATFORM_TOKEN_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `PLATFORM_TOKEN_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (base64-encoded)`
    );
  }
  return key;
}

/**
 * Encrypt a platform token (access/refresh) for at-rest storage.
 * Returns a string formatted as `v1:<iv-base64>:<tag-base64>:<cipher-base64>`.
 */
export function encryptPlatformToken(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptPlatformToken(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted token payload");
  }
  const [, ivB64, tagB64, cipherB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(cipherB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function encryptPlatformTokenOrNull(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  return encryptPlatformToken(plaintext);
}
