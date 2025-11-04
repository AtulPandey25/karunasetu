import { Response, Request } from "express";
import {
  verifyAdminCredentials,
  createAdminToken,
} from "../auth";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    let body: any = req.body ?? {};

    // Debug: minimal insight into what reached the server (no secrets logged)
    try {
      const bodyType = typeof body;
      const bodyKeys = body && typeof body === 'object' ? Object.keys(body) : [];
      console.log("/api/admin/login body type:", bodyType, "keys:", bodyKeys);
    } catch {}

    // Parse if string JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    // If still not an object, reset to empty
    if (!body || typeof body !== 'object') body = {};

    // Sometimes proxies wrap under 'data'
    const candidate = ((): any => {
      if (body && typeof body === 'object') return body;
      return {};
    })();

    let { email, password } = candidate as {
      email?: unknown;
      password?: unknown;
    };

    // Fallbacks: nested under data, or packed into a single key
    if ((email == null || password == null) && candidate && typeof candidate === 'object') {
      if (candidate.data && typeof candidate.data === 'object') {
        email = (candidate.data as any).email ?? email;
        password = (candidate.data as any).password ?? password;
      }
      const onlyKeys = Object.keys(candidate);
      if ((email == null || password == null) && onlyKeys.length === 1) {
        const sole = candidate[onlyKeys[0]];
        if (typeof sole === 'string') {
          try {
            const parsed = JSON.parse(sole);
            email = (parsed as any).email ?? email;
            password = (parsed as any).password ?? password;
          } catch {}
        }
      }
    }

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
