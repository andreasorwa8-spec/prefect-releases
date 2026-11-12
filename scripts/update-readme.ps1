# update-readme.ps1 -- accurate README for mobile repo
$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$path = "C:\dev\prefect-mobile\README.md"

if (Test-Path $path) {
    Copy-Item $path "$path.pre-audit-$(Get-Date -Format yyyyMMdd-HHmmss).md"
}

Push-Location C:\dev\prefect-mobile
$gitLog = (git log --format="  %h %ad %s" --date=short -10 2>&1 | Out-String)
Pop-Location

$content = @"
# Prefect Mobile

**Last audited:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Screens:** 59
**Expo SDK:** 57 (~57.0.27)
**React Native:** 0.86.3
**React:** 19.3.0
**Backend:** C:\dev\prefect

## Build

    npm install --legacy-peer-deps
    npx expo start --dev-client
    # on device: open Prefect dev build (not Expo Go)

## Session coverage

Complete: 1-19, 22, 24, 25, 26, 27, 28, 29, 33, 34, 37
Missing: 31b, 31c, 32, 35, 38-40

## Infrastructure status

- expo-location: installing (for geofence)
- expo-notifications: installed, registration wired
- expo-document-picker: not installed
- expo-av: not installed
- react-native-sse: not installed (chat polls)

## Recent commits

$gitLog

## Related docs

- C:\dev\prefect\FEATURE-INVENTORY.md
- C:\dev\prefect\ROADMAP.md
- C:\dev\prefect\CHECKPOINT.md
"@

[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
Write-Host "Wrote $path"