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
  console.log(`ADMIN_EMAIL from .env: ${ADMIN_EMAIL}`);
  console.log(`Attempting to verify credentials for email: ${email}`);
  console.log(`Received password: ${password}`);

  if (email !== ADMIN_EMAIL) {
    console.log("Email does not match ADMIN_EMAIL.");
    return false;
  }
  if (!adminPasswordHash) {
    console.log("adminPasswordHash is not set.");
    return false;
  }

  console.log("Comparing password with hash...");
  const isMatch = await compare(password, adminPasswordHash);
  console.log(`Password match result: ${isMatch}`);

  return isMatch;
}

export function createAdminToken(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not configured");
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
