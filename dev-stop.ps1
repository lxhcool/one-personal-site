$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunDir = Join-Path $Root '.dev-run'
$PidFile = Join-Path $RunDir 'pids.json'

function Stop-ProcessTree {
  param([Parameter(Mandatory = $true)][int]$ProcessId)

  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ProcessId"
  foreach ($child in $children) {
    Stop-ProcessTree -ProcessId $child.ProcessId
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $ProcessId -Force
  }
}

if (-not (Test-Path $PidFile)) {
  Write-Host "No running service state found at: $PidFile"
  exit 0
}

$services = Get-Content $PidFile -Raw | ConvertFrom-Json
if ($null -eq $services) {
  Write-Host "Run state is empty: $PidFile"
  Remove-Item $PidFile -Force
  exit 0
}

foreach ($service in @($services)) {
  Write-Host ("Stopping {0}: PID {1}" -f $service.name, $service.pid)
  Stop-ProcessTree -ProcessId ([int]$service.pid)
}

Remove-Item $PidFile -Force
Write-Host 'Stopped development services.'
