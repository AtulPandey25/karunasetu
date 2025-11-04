import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
let adminPasswordHash: string | null = null;

export async function initAdminHash() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD not set. Admin login will be disabled.");
    return;
  }
  adminPasswordHash = await hash(adminPassword, 10);
  console.log("✅ Admin password hash initialized");
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  if (email !== ADMIN_EMAIL) {
    return false;
  }
  if (!adminPasswordHash) {
    return false;
  }

  // This is the fix: Ensure adminPasswordHash is a valid string before proceeding.
  // If it's null (because the ADMIN_PASSWORD env var was not set), immediately return false.
  if (typeof adminPasswordHash !== 'string') {
    console.error("Admin password hash is not initialized. Cannot verify credentials.");
    return false;
  }

  const isMatch = await compare(password, adminPasswordHash);

  return isMatch;
}

export function createAdminToken(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET not configured");
  }
  return jwt.sign({ admin: true }, secret, { expiresIn: "1h" });
}

export function verifyAdminToken(token: string) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return null;
  }
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
