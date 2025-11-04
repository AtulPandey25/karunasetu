import { Response, Request } from "express";
import {
  verifyAdminCredentials,
  createAdminToken,
} from "../auth";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = (req.body ?? {}) as {
      email?: unknown;
      password?: unknown;
    };

    const normalizedEmail = typeof email === 'string' ? email.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password.trim() : '';

    if (!normalizedEmail || !normalizedPassword) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // Ensure server is properly configured
    if (!process.env.ADMIN_JWT_SECRET) {
      res.status(500).json({ error: "Server misconfigured: ADMIN_JWT_SECRET not set" });
      return;
    }

    try {
      const ok = await verifyAdminCredentials(normalizedEmail, normalizedPassword);
      if (!ok) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = createAdminToken();
      res.json({ token });
    } catch (err: any) {
      const message = err?.message || "Internal error";
      res.status(500).json({ error: message });
    }
  }
}
