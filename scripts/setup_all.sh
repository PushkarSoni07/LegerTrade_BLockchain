#!/bin/bash
set -e

echo "=== LedgerTrade Setup (Linux / macOS) ==="

echo "[1/4] Installing Blockchain dependencies..."
cd "$(dirname "$0")/../blockchain" && npm install

echo "[2/4] Installing Python ML dependencies..."
cd "$(dirname "$0")/../ml-service" && python3 -m pip install -r requirements.txt

echo "[3/4] Installing Backend dependencies..."
cd "$(dirname "$0")/../backend" && npm install

echo "[4/4] Installing Frontend dependencies..."
cd "$(dirname "$0")/../frontend" && npm install

echo "=== LedgerTrade Setup Complete ==="
