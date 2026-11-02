# ============================================================
# LedgerTrade - Full System Startup Script (PowerShell)
# Launches:
# 1. Hardhat Node (Port 8545) & Deploys Contracts
# 2. Python FastAPI ML Surveillance (Port 8000)
# 3. Node.js Express Backend (Port 5000)
# 4. Vite React Frontend (Port 3000)
# ============================================================
$ErrorActionPreference = "Continue"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Launching LedgerTrade Platform (All 4 Services)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$env:Path = "C:\Program Files\nodejs;" + $env:Path
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName

# 1. Start Hardhat Ethereum Node in separate window
Write-Host "[1/4] Starting Hardhat Local Ethereum Node (Port 8545)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; Set-Location '$rootDir\blockchain'; npx hardhat node"

Write-Host "Waiting for Hardhat node to listen on port 8545..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect("127.0.0.1", 8545, $null, $null)
        $wh = $iar.AsyncWaitHandle.WaitOne(500, $false)
        if ($wh -and $tcp.Connected) {
            $tcp.EndConnect($iar)
            $tcp.Close()
            $ready = $true
            break
        }
        $tcp.Close()
    } catch {
        # continue waiting
    }
}

if ($ready) {
    Write-Host "Hardhat node is ready! Deploying smart contracts..." -ForegroundColor Green
} else {
    Write-Host "Hardhat node startup timed out, attempting deployment anyway..." -ForegroundColor Yellow
}

# Deploy contracts onto the local node
Push-Location "$rootDir\blockchain"
& ".\node_modules\.bin\hardhat.cmd" run "scripts\deploy.js" --network localhost
Pop-Location

# 2. Start Python FastAPI AI Surveillance Service in separate window
Write-Host "`n[2/4] Starting Python FastAPI AI Surveillance Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\ml-service'; python run.py"

# 3. Start Node.js Express Backend in separate window
Write-Host "`n[3/4] Starting Node.js Express Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; Set-Location '$rootDir\backend'; npm run dev"

Start-Sleep -Seconds 2

# 4. Start React Vite Frontend in separate window
Write-Host "`n[4/4] Starting React Vite Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; Set-Location '$rootDir\frontend'; npm run dev"

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "  All LedgerTrade services launched successfully!" -ForegroundColor Green
Write-Host "  Web Application:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend REST API:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  FastAPI ML Docs:   http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Hardhat RPC:       http://localhost:8545" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
