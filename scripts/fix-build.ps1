$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path (Join-Path $scriptDir '..') 'dist'
$loader = Join-Path $dist 'service-worker-loader.js'
$assets = Join-Path $dist 'assets'

if (-not (Test-Path $loader)) {
  Write-Host "service-worker-loader.js not found, skipping fix"
  exit 0
}

# Find the newest background chunk (>5KB and contains chrome.runtime.onConnect)
$bgChunk = Get-ChildItem -LiteralPath $assets -Filter '*.js' |
  Where-Object { $_.Length -gt 5000 } |
  Where-Object { (Get-Content $_.FullName -Raw) -match 'chrome\.runtime\.onConnect' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $bgChunk) {
  Write-Host "WARNING: Could not find background chunk (searching $assets)"
  exit 0
}

$oldImport = (Get-Content $loader -Raw).Trim()
$newImport = "import './assets/$($bgChunk.Name)';"

if ($oldImport -ne $newImport) {
  Set-Content -LiteralPath $loader -Value $newImport -NoNewline
  Write-Host "Fixed service-worker-loader.js → $($bgChunk.Name)"
} else {
  Write-Host "service-worker-loader.js already correct"
}
