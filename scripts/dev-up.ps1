$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host 'Arquivo .env criado a partir de .env.example. Revise os valores locais.' -ForegroundColor Yellow
}

docker compose up -d
docker compose ps
