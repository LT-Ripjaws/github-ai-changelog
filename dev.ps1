[CmdletBinding()]
param(
  [switch]$CheckOnly,
  [switch]$ExitAfterReady,
  [int]$TimeoutSeconds = 180,
  [int]$PostgresPort = 55432,
  [int]$RedisPort = 6379
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

$script:BackendProcess = $null
$script:FrontendProcess = $null
$script:Stopping = $false

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($RootDir)) {
  $RootDir = (Get-Location).Path
}

$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendEnvFile = Join-Path $BackendDir ".env"
$ComposeFile = Join-Path $RootDir "docker-compose.yml"
$LogDir = Join-Path $RootDir ".dev-logs"
$BackendLog = Join-Path $LogDir "backend.log"
$FrontendLog = Join-Path $LogDir "frontend.log"
$BackendLauncher = Join-Path $LogDir "start-backend.cmd"
$FrontendLauncher = Join-Path $LogDir "start-frontend.cmd"
$BackendUrl = "http://127.0.0.1:3001/health"
$FrontendUrl = "http://127.0.0.1:3000"

function Write-Section {
  param([string]$Message)
  Write-Host ""
  Write-Host $Message
}

function Get-DockerExecutable {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if ($null -ne $docker) {
    if (-not [string]::IsNullOrWhiteSpace($docker.Source)) {
      return $docker.Source
    }
    return $docker.Name
  }

  $candidate = Join-Path ${env:ProgramFiles} "Docker\Docker\resources\bin\docker.exe"
  if (Test-Path -LiteralPath $candidate) {
    return $candidate
  }

  throw "Docker CLI was not found. Start a new PowerShell window after installing Docker Desktop, or add Docker to PATH."
}

function Assert-CommandAvailable {
  param([string]$Command)

  if ($null -eq (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "$Command was not found in PATH. Install Node.js LTS, then open a new PowerShell window."
  }
}

function Assert-PathExists {
  param(
    [string]$Path,
    [string]$Fix
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing required path: $Path`n$Fix"
  }
}

function Get-DotEnvValue {
  param(
    [string]$Path,
    [string]$Name,
    [string]$Default
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $Default
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
      continue
    }

    if ($trimmed -match "^$([regex]::Escape($Name))\s*=\s*(.*)$") {
      $value = $Matches[1].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      return $value
    }
  }

  return $Default
}

function Test-PortOpen {
  param([int]$Port)

  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(300, $false)
    if (-not $connected) {
      return $false
    }
    $client.EndConnect($async)
    return $true
  }
  catch {
    return $false
  }
  finally {
    $client.Close()
  }
}

function Get-PortOwnerSummary {
  param([int]$Port)

  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 5
    if ($null -eq $connections) {
      return "No listener details available."
    }

    $lines = foreach ($connection in $connections) {
      $proc = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
      $name = "unknown"
      if ($null -ne $proc) {
        $name = $proc.ProcessName
      }
      "PID $($connection.OwningProcess) $name"
    }

    return ($lines -join "`n")
  }
  catch {
    return "Could not inspect port owner: $($_.Exception.Message)"
  }
}

function Assert-PortFree {
  param(
    [int]$Port,
    [string]$Name
  )

  if (Test-PortOpen -Port $Port) {
    $owners = Get-PortOwnerSummary -Port $Port
    throw "$Name port $Port is already in use. Stop the existing process first.`n$owners"
  }
}

function Test-UrlReady {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  }
  catch {
    return $false
  }
}

function Write-LogTail {
  param(
    [string]$Path,
    [int]$Lines = 80
  )

  if (Test-Path -LiteralPath $Path) {
    Get-Content -LiteralPath $Path -Tail $Lines -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
  }
  else {
    Write-Host "Log file does not exist yet: $Path"
  }
}

function New-NpmLauncher {
  param(
    [string]$Path,
    [string]$WorkingDirectory,
    [string]$NpmArgs,
    [string]$LogFile,
    [hashtable]$Environment = @{}
  )

  $envLines = @()
  foreach ($key in $Environment.Keys) {
    $envLines += "set $key=$($Environment[$key])"
  }
  $envBlock = $envLines -join "`r`n"

  $content = @"
@echo off
cd /d "$WorkingDirectory"
$envBlock
npm.cmd $NpmArgs > "$LogFile" 2>&1
exit /b %ERRORLEVEL%
"@

  Set-Content -LiteralPath $Path -Value $content -Encoding ASCII
}

function Start-DevProcess {
  param(
    [string]$Name,
    [string]$LauncherPath
  )

  Write-Host "Starting $Name..."
  $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/d /c `"$LauncherPath`"" -PassThru -NoNewWindow
  Start-Sleep -Milliseconds 300
  if ($process.HasExited) {
    throw "$Name process exited immediately."
  }
  return $process
}

function Wait-ForUrl {
  param(
    [string]$Name,
    [string]$Url,
    [System.Diagnostics.Process]$Process,
    [string]$LogFile,
    [int]$Timeout
  )

  Write-Host -NoNewline "Waiting for $Name"
  $deadline = (Get-Date).AddSeconds($Timeout)

  while ((Get-Date) -lt $deadline) {
    if ($Process.HasExited) {
      Write-Host " failed."
      Write-Host "$Name process exited before becoming ready. Last 80 log lines:"
      Write-LogTail -Path $LogFile -Lines 80
      throw "$Name process exited before readiness."
    }

    if (Test-UrlReady -Url $Url) {
      Write-Host " ready."
      return
    }

    Start-Sleep -Seconds 1
    Write-Host -NoNewline "."
  }

  Write-Host " timed out."
  Write-Host "$Name did not become ready within ${Timeout}s. Last 80 log lines:"
  Write-LogTail -Path $LogFile -Lines 80
  throw "$Name readiness timed out."
}

function Stop-DevProcessTree {
  param(
    [System.Diagnostics.Process]$Process,
    [string]$Name
  )

  if ($null -eq $Process) {
    return
  }

  try {
    if (-not $Process.HasExited) {
      Write-Host "Stopping $Name..."
      & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
    }
  }
  catch {
    Write-Warning "Could not stop $Name cleanly: $($_.Exception.Message)"
  }
}

function Stop-AllDevProcesses {
  if ($script:Stopping) {
    return
  }

  $script:Stopping = $true
  Stop-DevProcessTree -Process $script:BackendProcess -Name "backend"
  Stop-DevProcessTree -Process $script:FrontendProcess -Name "frontend"
}

function Assert-WindowsNodeModulesReady {
  Assert-PathExists -Path (Join-Path $BackendDir "node_modules\.bin\nest.cmd") -Fix "Run: cd `"$BackendDir`"; npm install"
  Assert-PathExists -Path (Join-Path $FrontendDir "node_modules\.bin\next.cmd") -Fix "Run: cd `"$FrontendDir`"; npm install"
  Assert-PathExists -Path (Join-Path $BackendDir "node_modules\@swc\core-win32-x64-msvc") -Fix "Run from PowerShell: cd `"$BackendDir`"; npm install"
  Assert-PathExists -Path (Join-Path $FrontendDir "node_modules\@next\swc-win32-x64-msvc") -Fix "Run from PowerShell: cd `"$FrontendDir`"; npm install"
}

function Wait-PostgresReady {
  param(
    [string]$DockerExe,
    [string]$DbUser
  )

  Write-Host -NoNewline "Waiting for postgres"
  $deadline = (Get-Date).AddSeconds(60)

  while ((Get-Date) -lt $deadline) {
    & $DockerExe compose -f $ComposeFile exec -T postgres pg_isready -U $DbUser -d postgres *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host " ready."
      return
    }

    Start-Sleep -Seconds 1
    Write-Host -NoNewline "."
  }

  Write-Host " timed out."
  throw "Postgres did not become ready within 60s."
}

function Ensure-PostgresDatabase {
  param([string]$DockerExe)

  $dbUser = Get-DotEnvValue -Path $BackendEnvFile -Name "DB_USERNAME" -Default "postgres"
  $dbName = Get-DotEnvValue -Path $BackendEnvFile -Name "DB_NAME" -Default "changelog_db"

  Wait-PostgresReady -DockerExe $DockerExe -DbUser $dbUser

  Write-Host "Ensuring database '$dbName' exists..."
  $query = "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
  $result = (& $DockerExe compose -f $ComposeFile exec -T postgres psql -U $dbUser -d postgres -tAc $query 2>&1) -join "`n"
  if ($LASTEXITCODE -ne 0) {
    throw "Could not inspect Postgres databases:`n$result"
  }

  if ($result.Trim() -ne "1") {
    Write-Host "Creating database '$dbName'..."
    & $DockerExe compose -f $ComposeFile exec -T postgres createdb -U $dbUser $dbName | Out-Host
    if ($LASTEXITCODE -ne 0) {
      throw "Could not create database '$dbName'."
    }
  }

  Write-Host "Ensuring pgvector extension exists..."
  & $DockerExe compose -f $ComposeFile exec -T postgres psql -U $dbUser -d $dbName -c "CREATE EXTENSION IF NOT EXISTS vector;" | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Could not enable pgvector extension in '$dbName'."
  }
}

function Invoke-Preflight {
  Assert-PathExists -Path $BackendDir -Fix "Backend directory is missing. Run this script from the repo root."
  Assert-PathExists -Path $FrontendDir -Fix "Frontend directory is missing. Run this script from the repo root."
  Assert-PathExists -Path $ComposeFile -Fix "docker-compose.yml is missing. Run this script from the repo root."
  Assert-CommandAvailable -Command "npm.cmd"
  Assert-WindowsNodeModulesReady

  $dockerExe = Get-DockerExecutable
  Write-Host "Docker: $dockerExe"
  & $dockerExe version --format "{{.Server.Os}}/{{.Server.Arch}} {{.Server.Version}}" | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Docker is installed but the Docker daemon is not reachable. Start Docker Desktop first."
  }

  return $dockerExe
}

try {
  Write-Host "Starting RepoNarrate dev stack for Windows PowerShell..."

  New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
  Set-Content -LiteralPath $BackendLog -Value "" -Encoding UTF8
  Set-Content -LiteralPath $FrontendLog -Value "" -Encoding UTF8

  $dockerExe = Invoke-Preflight

  if ($CheckOnly) {
    Write-Host ""
    Write-Host "Preflight passed. Docker, npm, Windows SWC packages, and command shims are available."
    exit 0
  }

  Write-Section "Starting Docker services..."
  $env:POSTGRES_PORT = [string]$PostgresPort
  $env:REDIS_PORT = [string]$RedisPort
  & $dockerExe compose -f $ComposeFile up -d
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose up -d failed."
  }

  Ensure-PostgresDatabase -DockerExe $dockerExe

  Assert-PortFree -Port 3001 -Name "Backend"
  Assert-PortFree -Port 3000 -Name "Frontend"

  $backendEnvironment = @{
    DB_HOST = "127.0.0.1"
    DB_PORT = [string]$PostgresPort
    REDIS_HOST = "127.0.0.1"
    REDIS_PORT = [string]$RedisPort
  }

  New-NpmLauncher -Path $BackendLauncher -WorkingDirectory $BackendDir -NpmArgs "run start:dev" -LogFile $BackendLog -Environment $backendEnvironment
  New-NpmLauncher -Path $FrontendLauncher -WorkingDirectory $FrontendDir -NpmArgs "run dev" -LogFile $FrontendLog

  Write-Section "Starting application servers..."
  $script:BackendProcess = Start-DevProcess -Name "backend (NestJS + SWC watch)" -LauncherPath $BackendLauncher
  $script:FrontendProcess = Start-DevProcess -Name "frontend (Next.js dev server)" -LauncherPath $FrontendLauncher

  Wait-ForUrl -Name "backend" -Url $BackendUrl -Process $script:BackendProcess -LogFile $BackendLog -Timeout $TimeoutSeconds
  Wait-ForUrl -Name "frontend" -Url $FrontendUrl -Process $script:FrontendProcess -LogFile $FrontendLog -Timeout $TimeoutSeconds

  Write-Host ""
  Write-Host "  Backend:  http://localhost:3001"
  Write-Host "  Swagger:  http://localhost:3001/api"
  Write-Host "  Frontend: http://localhost:3000"
  Write-Host "  Postgres: 127.0.0.1:$PostgresPort"
  Write-Host "  Redis:    127.0.0.1:$RedisPort"
  Write-Host "  Logs:     $LogDir"
  Write-Host ""

  if ($ExitAfterReady) {
    Write-Host "ExitAfterReady requested; stopping verified dev stack."
    exit 0
  }

  Write-Host "Press Ctrl+C to stop."

  while ($true) {
    if ($script:BackendProcess.HasExited) {
      Write-Host "Backend exited. Last backend log lines:"
      Write-LogTail -Path $BackendLog -Lines 40
      throw "Backend dev server exited."
    }

    if ($script:FrontendProcess.HasExited) {
      Write-Host "Frontend exited. Last frontend log lines:"
      Write-LogTail -Path $FrontendLog -Lines 40
      throw "Frontend dev server exited."
    }

    Start-Sleep -Seconds 1
  }
}
finally {
  if (-not $CheckOnly) {
    Stop-AllDevProcesses
    Write-Host "Servers stopped. Logs are in: $LogDir"
  }
}
