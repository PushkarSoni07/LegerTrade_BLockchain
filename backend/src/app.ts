import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import apiRouter from "./routes";
import { ENV } from "./config/env";

const app = express();

// Middlewares
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (ENV.NODE_ENV !== "test") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  return res.json({
    status: "healthy",
    service: "LedgerTrade Backend API",
    mode: "academic-simulation",
    demoMode: ENV.DEMO_MODE,
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use("/api", apiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[ServerError]", err);
  const status = err.status || 500;
  return res.status(status).json({
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

export default app;
