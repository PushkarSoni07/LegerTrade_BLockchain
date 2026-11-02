# ============================================================
# LedgerTrade - Full Project Automated Setup Script (PowerShell)
# ============================================================
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  LedgerTrade Automated System Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Ensure Node.js is on PATH
$env:Path = "C:\Program Files\nodejs;" + $env:Path

Write-Host "`n[1/4] Installing Blockchain Dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\blockchain"
npm install

Write-Host "`n[2/4] Installing Python ML Service Dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\ml-service"
python -m pip install -r requirements.txt

Write-Host "`n[3/4] Installing Backend API Dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
npm install

Write-Host "`n[4/4] Installing Frontend React Dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
npm install

Set-Location "$PSScriptRoot\.."
Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "  LedgerTrade Setup Complete!" -ForegroundColor Green
Write-Host "  Run '.\scripts\start_all.ps1' to launch all services." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
