$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunDir = Join-Path $Root '.dev-run'
$PidFile = Join-Path $RunDir 'pids.json'

function Start-DevService {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Directory,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  $OutLog = Join-Path $RunDir "$Name.out.log"
  $ErrLog = Join-Path $RunDir "$Name.err.log"

  $process = Start-Process `
    -FilePath 'npm.cmd' `
    -ArgumentList $Arguments `
    -WorkingDirectory $Directory `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -WindowStyle Hidden `
    -PassThru

  [pscustomobject]@{
    name = $Name
    pid = $process.Id
    directory = $Directory
    stdout = $OutLog
    stderr = $ErrLog
  }
}

if (Test-Path $PidFile) {
  Write-Host "Found existing run state: $PidFile"
  Write-Host "Run .\dev-stop.ps1 first if you want to restart all services."
  exit 1
}

New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

$services = @(
  Start-DevService `
    -Name 'backend' `
    -Directory (Join-Path $Root 'lxhcool-backend') `
    -Arguments @('run', 'dev')

  Start-DevService `
    -Name 'frontend' `
    -Directory (Join-Path $Root 'lxhcool-frontend') `
    -Arguments @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '3000')

  Start-DevService `
    -Name 'admin' `
    -Directory (Join-Path $Root 'lxhcool-admin') `
    -Arguments @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173')
)

$services | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $PidFile

Write-Host 'Started development services:'
$services | ForEach-Object {
  Write-Host ("- {0}: PID {1}" -f $_.name, $_.pid)
}

Write-Host ''
Write-Host 'URLs:'
Write-Host '- Backend API: http://127.0.0.1:4000'
Write-Host '- API Docs:    http://127.0.0.1:4000/api-docs'
Write-Host '- Frontend:    http://127.0.0.1:3000'
Write-Host '- Admin:       http://127.0.0.1:5173'
Write-Host ''
Write-Host "Logs and process state are in: $RunDir"
Write-Host 'Stop everything with: .\dev-stop.ps1'
