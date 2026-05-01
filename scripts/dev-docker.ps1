$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker is required but was not found on PATH."
}

try {
  cmd /c "docker info >NUL 2>NUL"
} catch {
  Write-Error "Docker is installed, but this terminal cannot access the Docker engine. Start Docker Desktop, wait until it is running, then reopen PowerShell."
}

if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker is installed, but this terminal cannot access the Docker engine. Start Docker Desktop, wait until it is running, then reopen PowerShell."
}

if (-not (Test-Path ".env.development")) {
  if (-not (Test-Path ".env.development.example")) {
    Write-Error "Missing .env.development and .env.development.example."
  }

  Copy-Item ".env.development.example" ".env.development"
  Write-Host "Created .env.development from .env.development.example"
}

$envValues = @{}
Get-Content ".env.development" | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
    $key, $value = $line.Split("=", 2)
    $envValues[$key.Trim()] = $value.Trim().Trim("'").Trim('"')
  }
}

$missing = @()
if (-not $envValues["NEON_API_KEY"] -or $envValues["NEON_API_KEY"] -eq "your_neon_api_key") {
  $missing += "NEON_API_KEY"
}
if (-not $envValues["NEON_PROJECT_ID"] -or $envValues["NEON_PROJECT_ID"] -eq "your_neon_project_id") {
  $missing += "NEON_PROJECT_ID"
}

if ($missing.Count -gt 0) {
  Write-Error "Update .env.development with real Neon values before starting Docker: $($missing -join ', '). Neon Local returns 401 Unauthorized when these are placeholders."
}

$appPort = $envValues["APP_PORT"]
if (-not $appPort) {
  $appPort = "3001"
}

$neonLocalPort = $envValues["NEON_LOCAL_PORT"]
if (-not $neonLocalPort) {
  $neonLocalPort = "5432"
}

foreach ($portCheck in @(
  @{ Name = "APP_PORT"; Value = $appPort },
  @{ Name = "NEON_LOCAL_PORT"; Value = $neonLocalPort }
)) {
  $usedPort = Get-NetTCPConnection -LocalPort ([int]$portCheck.Value) -State Listen -ErrorAction SilentlyContinue
  if ($usedPort) {
    Write-Error "Host port $($portCheck.Value) is already in use. Stop the process using it, or set $($portCheck.Name) to a free port in .env.development."
  }
}

Write-Host "Starting development stack with Neon Local..."
Write-Host "API will be published on http://localhost:$appPort"

docker compose --env-file .env.development -f docker-compose.dev.yml down --remove-orphans
docker compose --env-file .env.development -f docker-compose.dev.yml up --build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Docker Compose failed. Recent logs:"
  docker compose --env-file .env.development -f docker-compose.dev.yml logs --tail=120
  exit $LASTEXITCODE
}
