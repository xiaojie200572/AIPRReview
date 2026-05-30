param(
  [string]$ZipName = 'pr-review-extension-1.0.0',
  [string]$DirName = 'pr-review-extension-1.0.0'
)

if (Test-Path 'release') { Remove-Item -Recurse -Force 'release' }
New-Item -ItemType Directory -Path 'release' | Out-Null

Rename-Item 'dist' $DirName
Compress-Archive -Path $DirName -DestinationPath "release/$ZipName.zip"
Rename-Item $DirName 'dist'

Write-Host "Repacked -> release/$ZipName.zip"
