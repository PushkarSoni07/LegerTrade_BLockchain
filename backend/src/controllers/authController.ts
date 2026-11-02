import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../storage/store";
import { ENV } from "../config/env";
import { User, UserRole } from "../types";

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password, role } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }

      if (db.getUserByEmailOrUsername(email) || db.getUserByEmailOrUsername(username)) {
        return res.status(400).json({ error: "Username or email is already taken" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userRole: UserRole = ["INVESTOR", "BROKER", "AUDITOR", "REGULATOR"].includes(role)
        ? role
        : "INVESTOR";

      // Deterministic demo wallet derivation
      const walletAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      const newUser: User = {
        id: `USR-${Date.now()}`,
        username,
        email,
        passwordHash,
        role: userRole,
        walletAddress,
        kycStatus: "APPROVED", // Auto-approved for frictionless academic demonstration
        createdAt: new Date().toISOString(),
      };

      db.saveUser(newUser);

      // Initialize starting portfolio: $50,000 simulated USD
      db.savePortfolio({
        userId: newUser.id,
        walletAddress: newUser.walletAddress,
        cashBalance: 50000.0,
        holdings: { AAPL: 50, TSLA: 20 },
        averageCosts: { AAPL: 170.0, TSLA: 200.0 },
        realizedPnL: 0,
        totalPortfolioValue: 50000.0 + 50 * 175 + 20 * 215,
        updatedAt: new Date().toISOString(),
      });

      const token = jwt.sign({ id: newUser.id, role: newUser.role }, ENV.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          walletAddress: newUser.walletAddress,
          kycStatus: newUser.kycStatus,
        },
        token,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = db.getUserByEmailOrUsername(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, ENV.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
          kycStatus: user.kycStatus,
        },
        token,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async getDemoUsers(req: Request, res: Response) {
    const all = db.getAllUsers().map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      walletAddress: u.walletAddress,
      kycStatus: u.kycStatus,
    }));
    return res.json(all);
  },

  async switchDemoAccount(req: Request, res: Response) {
    const { userId } = req.body;
    const user = db.getUserById(userId) || db.getUserByEmailOrUsername(userId);
    if (!user) {
      return res.status(404).json({ error: "Demo user not found" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: `Switched active demo account to ${user.username}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus,
      },
      token,
    });
  },

  async getProfile(req: any, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const portfolio = db.getPortfolio(user.id);
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus,
      },
      portfolio,
    });
  },
};
