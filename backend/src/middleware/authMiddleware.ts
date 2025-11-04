import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth";

interface AuthenticatedRequest extends Request {
  user?: any; // Or a more specific user type
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Token verification failed" });
    }
    req.user = decoded; // Attach user payload to the request
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};
