import { RequestHandler } from "express";
import { verifyAdminToken } from "../auth";

export const requireAdminKey: RequestHandler = (req, res, next) => {
  // Support legacy x-admin-key header
  const adminKey = process.env.ADMIN_API_KEY;
  const providedKey = req.headers["x-admin-key"] as string | undefined;

  if (adminKey && providedKey && adminKey === providedKey) {
    return next();
  }

  // Check Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  const verified = verifyAdminToken(token);

  if (!verified) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  (req as any).admin = verified; // attach payload if needed
  next();
};
