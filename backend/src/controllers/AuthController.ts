import { Response, Request } from "express";
import {
  verifyAdminCredentials,
  createAdminToken,
  initAdminHash,
} from "../auth";

// Initialize hash at startup
initAdminHash().catch((err) => {
  console.error("Failed to init admin hash", err);
});

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const ok = await verifyAdminCredentials(email, password);
    if (!ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = createAdminToken();
    res.json({ token });
  }
}
