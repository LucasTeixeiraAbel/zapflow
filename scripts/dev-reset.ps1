$ErrorActionPreference = 'Stop'
Write-Host 'ATENCAO: isso apagara os volumes locais do PostgreSQL e Redis.' -ForegroundColor Red
$confirmation = Read-Host 'Digite APAGAR para confirmar'
if ($confirmation -ne 'APAGAR') {
    Write-Host 'Operacao cancelada.'
    exit 0
}
docker compose down -v
Write-Host 'Volumes locais removidos. Execute scripts/dev-up.ps1 para recriar a infraestrutura.' -ForegroundColor Yellow
