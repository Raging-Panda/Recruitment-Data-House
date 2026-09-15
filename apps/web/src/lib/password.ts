import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// scrypt over bcrypt/argon2 specifically to avoid adding a dependency —
// Node's crypto module ships it natively. KEY_LENGTH=64 matches scrypt's
// own recommended minimum for this cost profile.
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  // Constant-time compare — a plain === would leak how many leading bytes
  // matched via response timing.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
