import { Response, Request } from "express";
import {
  comparePassword,
  createToken,
  getAdminUser,
  initAdminUser
} from "../auth";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const adminUser = getAdminUser();

    if (!adminUser || !adminUser.passwordHash) {
      res.status(500).json({ error: "Server misconfigured: Admin user not initialized" });
      return;
    }

    if (email !== adminUser.email) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isMatch = await comparePassword(password, adminUser.passwordHash);

    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    try {
      const token = createToken({ id: adminUser.email, isAdmin: true });
      res.json({ token });
    } catch (err: any) {
      console.error("Error creating token:", err);
      res.status(500).json({ error: "Failed to create authentication token" });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // For JWT, logout is client-side (delete token from storage).
    // Server-side, we just acknowledge the request.
    res.status(200).json({ message: "Logged out successfully" });
  }
}