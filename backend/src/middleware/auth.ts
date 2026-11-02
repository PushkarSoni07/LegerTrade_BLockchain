import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { db } from "../storage/store";
import { User } from "../types";

export interface AuthRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Support demo account switching header for quick evaluation
  const demoUserId = req.headers["x-demo-user"] as string;
  if (demoUserId) {
    const demoUser = db.getUserById(demoUserId) || db.getUserByEmailOrUsername(demoUserId);
    if (demoUser) {
      req.user = demoUser;
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Default to Alice if in demo mode and no auth provided for frictionless exploration
    if (ENV.DEMO_MODE) {
      const defaultUser = db.getUserByEmailOrUsername("alice") || db.getAllUsers()[0];
      if (defaultUser) {
        req.user = defaultUser;
        return next();
      }
    }
    return res.status(401).json({ error: "Authentication token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; role: string };
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User session not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' lacks permission for this endpoint. Required: [${allowedRoles.join(", ")}]`,
      });
    }
    next();
  };
}
