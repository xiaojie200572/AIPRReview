param(
  [string]$DistDir = 'dist'
)

$swPath = Join-Path $DistDir 'service-worker-loader.js'
if (-not (Test-Path $swPath)) {
  Write-Host "service-worker-loader.js not found, skipping"
  exit 0
}

$swContent = Get-Content $swPath -Raw
$files = Get-ChildItem (Join-Path $DistDir 'assets/index.js-*.js')

# Find the service worker bundle (contains api.github.com)
$correct = $files | Where-Object {
  Select-String -Path $_.FullName -Pattern 'api\.github\.com' -Quiet
} | Select-Object -First 1

if (-not $correct) {
  Write-Error "Cannot find service worker bundle"
  exit 1
}

$swContent = $swContent -replace "index\.js-[^']+", $correct.Name
Set-Content $swPath $swContent
Write-Host "Fixed service-worker-loader.js -> $($correct.Name)"
