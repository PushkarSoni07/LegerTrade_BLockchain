import app from "./app";
import { ENV } from "./config/env";
import { seedInitialData } from "./seed/seedData";
import { marketService } from "./services/marketService";

async function bootstrap() {
  console.log("--------------------------------------------------");
  console.log("Starting LedgerTrade Financial Backend API");
  console.log("Environment:", ENV.NODE_ENV);
  console.log("Port:", ENV.PORT);
  console.log("Blockchain RPC:", ENV.BLOCKCHAIN_RPC_URL);
  console.log("ML Microservice:", ENV.ML_SERVICE_URL);
  console.log("--------------------------------------------------");

  // Seed default data store if empty
  await seedInitialData();

  // Start continuous simulated market ticks
  marketService.startPeriodicSimulation(3000);

  app.listen(ENV.PORT, () => {
    console.log(`[LedgerTrade Backend] Server listening on http://localhost:${ENV.PORT}`);
    console.log(`[LedgerTrade Backend] API endpoints available at http://localhost:${ENV.PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
