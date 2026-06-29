# PrimeX CRM - Start Backend Server
# Run this from the backend/ directory

Write-Host "Starting PrimeX CRM Backend..." -ForegroundColor Cyan
Write-Host "Database: Neon PostgreSQL" -ForegroundColor Green
Write-Host "API: http://localhost:8000" -ForegroundColor Green
Write-Host "Docs: http://localhost:8000/api/docs" -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level warning
