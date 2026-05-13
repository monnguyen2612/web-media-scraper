# Database reset script for Windows (PowerShell)
$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host "`n==> $msg" -ForegroundColor Cyan
}

# Set working directory to repo root
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location ".."

Write-Host "WARNING: This will permanently delete all database and redis data!" -ForegroundColor Red
$confirmation = Read-Host "Are you sure you want to continue? (y/N)"
if ($confirmation -notmatch "^[Yy]$") {
    Write-Host "Operation cancelled."
    exit 1
}

Write-Step "Stopping services and removing volumes..."
docker compose down -v

Write-Host "==> Database and volumes removed successfully." -ForegroundColor Cyan
Write-Host "Run '.\scripts\realtime-up.ps1' to start fresh."
