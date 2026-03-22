$ErrorActionPreference = "Stop"

$ROOT_DIR = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$BIN_ZIP_ID = "13UO2pVHJ539oVcCxm_LeKit_i1wQzF55"
$PUBLIC_ZIP_ID = "1-GcJeBk6PwEochpzBNXtuaDuSpRq-PvR"

function Download-GDrive($FileId, $Output) {
    Write-Host "    Downloading from Google Drive (ID: $FileId)..."
    $url = "https://drive.usercontent.google.com/download?id=$FileId&export=download&confirm=t"
    Invoke-WebRequest -Uri $url -OutFile $Output -UseBasicParsing
}

Write-Host "==> Downloading & extracting public.zip (3D models)..."
if (-not (Test-Path "$ROOT_DIR\public\models\Avatar")) {
    Download-GDrive $PUBLIC_ZIP_ID "$ROOT_DIR\public.zip"
    Expand-Archive -Path "$ROOT_DIR\public.zip" -DestinationPath "$ROOT_DIR\public\" -Force
    Remove-Item "$ROOT_DIR\public.zip" -Force
    Write-Host "    Done."
} else {
    Write-Host "    SKIP: public/models already exists"
}

Write-Host "==> Downloading & extracting bin.zip (rhubarb lip-sync)..."
if (-not (Test-Path "$ROOT_DIR\backend\bin\rhubarb")) {
    Download-GDrive $BIN_ZIP_ID "$ROOT_DIR\backend\bin.zip"
    Expand-Archive -Path "$ROOT_DIR\backend\bin.zip" -DestinationPath "$ROOT_DIR\backend\" -Force
    New-Item -ItemType Directory -Path "$ROOT_DIR\backend\bin" -Force | Out-Null
    Move-Item "$ROOT_DIR\backend\rhubarb" "$ROOT_DIR\backend\bin\rhubarb" -Force
    Remove-Item "$ROOT_DIR\backend\extras", "$ROOT_DIR\backend\tests", "$ROOT_DIR\backend\res",
        "$ROOT_DIR\backend\CHANGELOG.md", "$ROOT_DIR\backend\LICENSE.md", "$ROOT_DIR\backend\README.adoc" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$ROOT_DIR\backend\bin.zip" -Force
    Write-Host "    Done."
} else {
    Write-Host "    SKIP: backend/bin/rhubarb already exists"
}

Write-Host "==> Setting up backend .env..."
if (-not (Test-Path "$ROOT_DIR\backend\.env")) {
    Copy-Item "$ROOT_DIR\backend\.env.example" "$ROOT_DIR\backend\.env"
    Write-Host "    Copied .env.example -> .env (edit with your API keys)"
} else {
    Write-Host "    .env already exists, skipping."
}

Write-Host "==> Building Docker image..."
Set-Location $ROOT_DIR
docker compose build

Write-Host "==> All done! Run '.\scripts\run.ps1' to start."
