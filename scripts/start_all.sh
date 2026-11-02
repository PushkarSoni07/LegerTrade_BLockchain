#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Starting LedgerTrade Multi-Service Environment ==="

# 1. Hardhat Node
echo "[1/4] Starting Hardhat Node..."
(cd "$ROOT_DIR/blockchain" && npx hardhat node) &
HARDHAT_PID=$!
sleep 4

# Deploy contracts
echo "Deploying contracts..."
(cd "$ROOT_DIR/blockchain" && npx hardhat run scripts/deploy.js --network localhost)

# 2. Python ML Microservice
echo "[2/4] Starting Python ML Microservice..."
(cd "$ROOT_DIR/ml-service" && python3 run.py) &
ML_PID=$!

# 3. Backend API
echo "[3/4] Starting Node.js Backend..."
(cd "$ROOT_DIR/backend" && npm run dev) &
BACKEND_PID=$!
sleep 2

# 4. Frontend Vite
echo "[4/4] Starting React Frontend..."
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo "=== All services launched ==="
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:5000"
echo "ML API:    http://localhost:8000/docs"
echo "RPC Node:  http://localhost:8545"

trap "kill $HARDHAT_PID $ML_PID $BACKEND_PID $FRONTEND_PID" EXIT
wait
