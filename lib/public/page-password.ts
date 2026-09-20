import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { hashPassword, verifyPassword } from "better-auth/crypto";

/**
 * Page passwords are hashed for unlock checks. A separate sealed copy is
 * stored so the owner can reveal the share password later.
 */
export async function hashPagePassword(password: string): Promise<string> {
  return hashPassword(password);
}

export async function verifyPagePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return verifyPassword({ password, hash });
}

const SEAL_PREFIX = "v1";

function requireSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }
  return secret;
}

function sealKey(): Buffer {
  return createHash("sha256")
    .update(`page-password-reveal:${requireSecret()}`)
    .digest();
}

export function sealPagePassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sealKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    SEAL_PREFIX,
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function unsealPagePassword(stored: string | null): string | null {
  if (!stored) {
    return null;
  }

  const [prefix, ivB64, dataB64, tagB64] = stored.split(".");
  if (prefix !== SEAL_PREFIX || !ivB64 || !dataB64 || !tagB64) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      sealKey(),
      Buffer.from(ivB64, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    return (
      decipher.update(Buffer.from(dataB64, "base64url")) +
      decipher.final("utf8")
    );
  } catch {
    return null;
  }
}
