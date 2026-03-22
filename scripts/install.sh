#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Google Drive file IDs
BIN_ZIP_ID="13UO2pVHJ539oVcCxm_LeKit_i1wQzF55"
PUBLIC_ZIP_ID="1-GcJeBk6PwEochpzBNXtuaDuSpRq-PvR"

download_gdrive() {
  FILE_ID=$1
  OUTPUT=$2
  echo "    Downloading from Google Drive (ID: $FILE_ID)..."
  curl -L -o "$OUTPUT" "https://drive.usercontent.google.com/download?id=$FILE_ID&export=download&confirm=t"
}

echo "==> Downloading & extracting public.zip (3D models)..."
if [ ! -d "$ROOT_DIR/public/models/Avatar" ]; then
  download_gdrive "$PUBLIC_ZIP_ID" "$ROOT_DIR/public.zip"
  unzip -o "$ROOT_DIR/public.zip" -d "$ROOT_DIR/public/"
  rm -f "$ROOT_DIR/public.zip"
  echo "    Done."
else
  echo "    SKIP: public/models already exists"
fi

echo "==> Downloading & extracting bin.zip (rhubarb lip-sync)..."
if [ ! -f "$ROOT_DIR/backend/bin/rhubarb" ]; then
  download_gdrive "$BIN_ZIP_ID" "$ROOT_DIR/backend/bin.zip"
  unzip -o "$ROOT_DIR/backend/bin.zip" -d "$ROOT_DIR/backend/"
  mkdir -p "$ROOT_DIR/backend/bin"
  mv "$ROOT_DIR/backend/rhubarb" "$ROOT_DIR/backend/bin/rhubarb"
  chmod +x "$ROOT_DIR/backend/bin/rhubarb"
  rm -rf "$ROOT_DIR/backend/extras" "$ROOT_DIR/backend/tests" "$ROOT_DIR/backend/res" \
         "$ROOT_DIR/backend/CHANGELOG.md" "$ROOT_DIR/backend/LICENSE.md" "$ROOT_DIR/backend/README.adoc"
  rm -f "$ROOT_DIR/backend/bin.zip"
  echo "    Done. rhubarb is executable."
else
  echo "    SKIP: backend/bin/rhubarb already exists"
fi

echo "==> Setting up backend .env..."
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
  echo "    Copied .env.example -> .env (edit with your API keys)"
else
  echo "    .env already exists, skipping."
fi

echo "==> Building Docker image..."
cd "$ROOT_DIR"
docker compose build

echo "==> All done! Run 'bash scripts/run.sh' to start."
