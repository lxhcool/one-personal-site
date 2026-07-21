param(
  [string]$Server = 'root@175.24.199.30',
  [string]$BasePath = '/www/wwwroot/lxhcool-app',
  [string]$SiteUrl = 'https://lxhcoool.cn',
  [switch]$SkipBuild,
  [switch]$Push
)

$ErrorActionPreference = 'Stop'
$SiteUrl = $SiteUrl.TrimEnd('/')
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$commit = (& git -C $root rev-parse --short HEAD).Trim()
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$releaseId = "$timestamp-$commit"
$tempRoot = Join-Path $root ".deploy-tmp-$releaseId"

function Invoke-Checked {
  param(
    [Parameter(Mandatory)] [string]$FilePath,
    [Parameter(ValueFromRemainingArguments)] [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath exited with code $LASTEXITCODE"
  }
}

function Invoke-NpmBuild {
  param(
    [Parameter(Mandatory)] [string]$Directory,
    [Parameter(Mandatory)] [string[]]$Commands,
    [hashtable]$Environment = @{}
  )

  Push-Location $Directory
  try {
    foreach ($entry in $Environment.GetEnumerator()) {
      Set-Item -Path "Env:$($entry.Key)" -Value $entry.Value
    }
    foreach ($command in $Commands) {
      Invoke-Checked npm.cmd run $command
    }
  }
  finally {
    Pop-Location
  }
}

try {
  New-Item -ItemType Directory -Path $tempRoot | Out-Null

  if (-not $SkipBuild) {
    Invoke-NpmBuild -Directory (Join-Path $root 'lxhcool-admin') -Commands @('build') -Environment @{
      VITE_API_BASE_URL = '/api'
      VITE_BASE_PATH = '/manage/'
    }

    Invoke-NpmBuild -Directory (Join-Path $root 'lxhcool-backend') -Commands @('build')

    Invoke-NpmBuild -Directory (Join-Path $root 'lxhcool-frontend') -Commands @('typecheck', 'build') -Environment @{
      NUXT_API_BASE_URL = 'http://127.0.0.1:4000'
      NUXT_PUBLIC_SITE_URL = $SiteUrl
      NUXT_PUBLIC_API_BASE_URL = "$SiteUrl/api"
      NUXT_PUBLIC_ADMIN_URL = "$SiteUrl/manage/"
    }
  }

  $frontendArchive = Join-Path $tempRoot "lxhcool-frontend-$releaseId.tar.gz"
  $adminArchive = Join-Path $tempRoot "lxhcool-admin-$releaseId.tar.gz"
  $backendArchive = Join-Path $tempRoot "lxhcool-backend-$releaseId.tar.gz"

  Invoke-Checked tar -czf $frontendArchive -C (Join-Path $root 'lxhcool-frontend') .output
  Invoke-Checked tar -czf $adminArchive -C (Join-Path $root 'lxhcool-admin') dist
  Invoke-Checked tar -czf $backendArchive -C (Join-Path $root 'lxhcool-backend') dist prisma package.json package-lock.json

  Invoke-Checked scp -o BatchMode=yes $frontendArchive $adminArchive $backendArchive (Join-Path $PSScriptRoot 'deploy-remote.sh') "${Server}:/tmp/"
  Invoke-Checked ssh -o BatchMode=yes $Server "bash /tmp/deploy-remote.sh '$releaseId' '$BasePath' '$SiteUrl'"

  $checks = @(
    "$SiteUrl/",
    "$SiteUrl/manage/",
    "$SiteUrl/api/public/widgets",
    "$SiteUrl/api/public/posts?type=ARTICLE"
  )
  foreach ($url in $checks) {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    if ($response.StatusCode -ne 200) {
      throw "Health check failed: $url returned $($response.StatusCode)"
    }
    Write-Host "200 $url"
  }

  if ($Push) {
    Invoke-Checked git -C $root push origin main
  }

  Write-Host "Deployment complete: $releaseId"
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    $resolvedTemp = (Resolve-Path -LiteralPath $tempRoot).Path
    if (-not $resolvedTemp.StartsWith($root + [IO.Path]::DirectorySeparatorChar)) {
      throw "Unsafe deployment cleanup path: $resolvedTemp"
    }
    Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
  }
}
