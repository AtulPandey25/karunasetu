import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export function createToken(payload: object): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

export function verifyToken(token: string) {
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

// Placeholder for admin user in a real application, this would come from a database
let adminUser = {
  email: ADMIN_EMAIL,
  passwordHash: "" // This will be set on server start
};

export async function initAdminUser() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD not set. Admin login will be disabled.");
    return;
  }
  adminUser.passwordHash = await hashPassword(adminPassword);
  console.log("✅ Admin user initialized");
}

export function getAdminUser() {
  return adminUser;
}