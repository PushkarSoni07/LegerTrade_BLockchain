"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const store_1 = require("../storage/store");
function authMiddleware(req, res, next) {
    // Support demo account switching header for quick evaluation
    const demoUserId = req.headers["x-demo-user"];
    if (demoUserId) {
        const demoUser = store_1.db.getUserById(demoUserId) || store_1.db.getUserByEmailOrUsername(demoUserId);
        if (demoUser) {
            req.user = demoUser;
            return next();
        }
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // Default to Alice if in demo mode and no auth provided for frictionless exploration
        if (env_1.ENV.DEMO_MODE) {
            const defaultUser = store_1.db.getUserByEmailOrUsername("alice") || store_1.db.getAllUsers()[0];
            if (defaultUser) {
                req.user = defaultUser;
                return next();
            }
        }
        return res.status(401).json({ error: "Authentication token required" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        const user = store_1.db.getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: "User session not found" });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
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
