"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
exports.ENV = {
    PORT: parseInt(process.env.PORT || "5000", 10),
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET || "super_secret_academic_jwt_token_key_12345",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
    ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
    DEMO_MODE: process.env.DEMO_MODE === "true" || true,
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/ledgertrade",
};
