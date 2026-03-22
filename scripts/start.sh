#!/bin/bash
set -e

echo "==> Starting backend (port 3000)..."
cd /app/backend
node server.js &

echo "==> Starting frontend (port 5173)..."
cd /app
npm run dev &

wait
