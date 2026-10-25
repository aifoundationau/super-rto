# PowerShell script to copy frontend views and assets from rto-ai into Super-RTO
# NOTE: This only READS from rto-ai and NEVER modifies rto-ai.
$ErrorActionPreference = 'Stop'

$src = "E:\Antigravity Projects\rto-ai"
$dest = "E:\Antigravity Projects\Super-RTO"

Write-Host "Syncing data from rto-ai..."
if (Test-Path "$src\data") {
    Copy-Item -Path "$src\data\*" -Destination "$dest\data" -Recurse -Force
}

Write-Host "Syncing public assets from rto-ai..."
if (Test-Path "$src\public") {
    if (-not (Test-Path "$dest\public")) { New-Item -ItemType Directory -Path "$dest\public" -Force | Out-Null }
    Copy-Item -Path "$src\public\*" -Destination "$dest\public" -Recurse -Force
}

Write-Host "Syncing lib/agent, lib/calendar, lib/export from rto-ai..."
foreach ($libDir in @('agent', 'calendar', 'export')) {
    if (Test-Path "$src\lib\$libDir") {
        if (-not (Test-Path "$dest\lib\$libDir")) { New-Item -ItemType Directory -Path "$dest\lib\$libDir" -Force | Out-Null }
        Copy-Item -Path "$src\lib\$libDir\*" -Destination "$dest\lib\$libDir" -Recurse -Force
    }
}

Write-Host "Syncing app/api from rto-ai..."
if (Test-Path "$src\app\api") {
    if (-not (Test-Path "$dest\app\api")) { New-Item -ItemType Directory -Path "$dest\app\api" -Force | Out-Null }
    Copy-Item -Path "$src\app\api\*" -Destination "$dest\app\api" -Recurse -Force
}

Write-Host "Syncing components from rto-ai..."
$componentsToSync = @('home', 'catalog', 'application', 'events', 'chat', 'admin', 'auth', 'weather', 'emergency')
foreach ($comp in $componentsToSync) {
    if (Test-Path "$src\components\$comp") {
        if (-not (Test-Path "$dest\components\$comp")) { New-Item -ItemType Directory -Path "$dest\components\$comp" -Force | Out-Null }
        Copy-Item -Path "$src\components\$comp\*" -Destination "$dest\components\$comp" -Recurse -Force
    }
}

# Copy root components (ApiKeyModal, GoogleTranslate, etc.)
foreach ($file in @('ApiKeyModal.tsx', 'GoogleTranslate.tsx', 'Navbar.tsx', 'Footer.tsx')) {
    if (Test-Path "$src\components\$file") {
        Copy-Item -Path "$src\components\$file" -Destination "$dest\components\$file" -Force
    }
}

Write-Host "Sync completed successfully."
