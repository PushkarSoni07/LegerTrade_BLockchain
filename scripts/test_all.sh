#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== LedgerTrade System-Wide Test Suite ==="

echo "[1/3] Running Hardhat Contract Tests..."
cd "$ROOT_DIR/blockchain" && npx hardhat test

echo "[2/3] Running Python ML Surveillance Tests..."
cd "$ROOT_DIR/ml-service" && python3 test_ml.py

echo "[3/3] Running Backend API Integration Tests..."
cd "$ROOT_DIR/backend" && npx ts-node-dev src/tests/api.test.ts

echo "=== All Tests Passed Successfully! ==="
