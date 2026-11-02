# LedgerTrade Troubleshooting & Setup Guide

## 1. Port Assignments
LedgerTrade utilizes four default network ports:
- **`3000`**: React + Vite Web UI
- **`5000`**: Node.js Express Backend REST API
- **`8000`**: Python FastAPI AI Surveillance Microservice
- **`8545`**: Hardhat Localhost EVM JSON-RPC Node

If a port is already occupied by another application, kill the process or configure `.env`:
```powershell
# Check which process is occupying port 5000 in Windows PowerShell
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
Stop-Process -Id <OwningProcessId> -Force
```

---

## 2. Windows PowerShell Execution Policy
If PowerShell blocks script execution (`running scripts is disabled on this system`), run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

---

## 3. Node.js & npm Path Environment
If PowerShell does not detect `node` or `npm`:
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
node -v
npm -v
```

---

## 4. MetaMask Localhost Network Setup
To connect MetaMask to the local Hardhat blockchain node:
1. Open MetaMask -> Settings -> Networks -> **Add a network manually**.
2. **Network Name**: `Hardhat Localhost`
3. **New RPC URL**: `http://127.0.0.1:8545`
4. **Chain ID**: `31337`
5. **Currency Symbol**: `ETH`
6. Import Hardhat test account #1 using its private key:
   `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` (Alice / Deployer test account with 10,000 local test ETH).

> **Note**: Even if MetaMask is not installed, LedgerTrade provides a full local simulation fallback with realistic tx hashes so all features remain accessible.
