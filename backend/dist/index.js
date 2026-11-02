"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const seedData_1 = require("./seed/seedData");
const marketService_1 = require("./services/marketService");
async function bootstrap() {
    console.log("--------------------------------------------------");
    console.log("Starting LedgerTrade Financial Backend API");
    console.log("Environment:", env_1.ENV.NODE_ENV);
    console.log("Port:", env_1.ENV.PORT);
    console.log("Blockchain RPC:", env_1.ENV.BLOCKCHAIN_RPC_URL);
    console.log("ML Microservice:", env_1.ENV.ML_SERVICE_URL);
    console.log("--------------------------------------------------");
    // Seed default data store if empty
    await (0, seedData_1.seedInitialData)();
    // Start continuous simulated market ticks
    marketService_1.marketService.startPeriodicSimulation(3000);
    app_1.default.listen(env_1.ENV.PORT, () => {
        console.log(`[LedgerTrade Backend] Server listening on http://localhost:${env_1.ENV.PORT}`);
        console.log(`[LedgerTrade Backend] API endpoints available at http://localhost:${env_1.ENV.PORT}/api`);
    });
}
bootstrap().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
