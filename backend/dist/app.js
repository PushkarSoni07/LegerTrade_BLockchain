"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({ origin: env_1.ENV.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging in development
if (env_1.ENV.NODE_ENV !== "test") {
    app.use((req, res, next) => {
        const start = Date.now();
        res.on("finish", () => {
            const duration = Date.now() - start;
            console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
        });
        next();
    });
}
// Health check endpoint
app.get("/health", (req, res) => {
    return res.json({
        status: "healthy",
        service: "LedgerTrade Backend API",
        mode: "academic-simulation",
        demoMode: env_1.ENV.DEMO_MODE,
        timestamp: new Date().toISOString(),
    });
});
// Mount modular API routes
app.use("/api", routes_1.default);
// 404 handler
app.use((req, res) => {
    return res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});
// Centralized error handler
app.use((err, req, res, next) => {
    console.error("[ServerError]", err);
    const status = err.status || 500;
    return res.status(status).json({
        error: err.message || "Internal server error",
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
