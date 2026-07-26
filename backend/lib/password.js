import { hash, verify } from "@node-rs/argon2";

// OWASP Password Storage Cheat Sheet baseline for Argon2id.
const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1
};

export const PASSWORD_MIN_LENGTH = 10;

export async function hashPassword(plainPassword) {
  return hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash, plainPassword) {
  try {
    return await verify(passwordHash, plainPassword, ARGON2_OPTIONS);
  } catch {
    // A malformed or truncated hash must read as "wrong password", never as an
    // error the caller might mistake for success.
    return false;
  }
}

/**
 * Returns null when acceptable, otherwise a user-facing reason. Kept
 * deliberately simple: length beats composition rules for real-world strength.
 */
export function validatePasswordStrength(plainPassword) {
  const password = String(plainPassword || "");
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > 200) return "Password must be under 200 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}
