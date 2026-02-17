#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/stubbornstumps"
APP_NAME="stubbornstumps"
BRANCH="main"
FORMSPREE_ENDPOINT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --app-name)
      APP_NAME="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --formspree)
      FORMSPREE_ENDPOINT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage:"
      echo "  bash scripts/update-only.sh"
      echo "  bash scripts/update-only.sh --branch main --formspree https://formspree.io/f/xxxxxxx"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Git repository not found: $APP_DIR"
  exit 1
fi

echo "[1/5] Updating source code..."
git -C "$APP_DIR" fetch --all --prune
git -C "$APP_DIR" checkout "$BRANCH"
git -C "$APP_DIR" reset --hard "origin/$BRANCH"

echo "[2/5] Installing project dependencies..."
cd "$APP_DIR"
npm ci

if [[ -n "$FORMSPREE_ENDPOINT" ]]; then
  echo "[3/5] Updating Formspree endpoint in .env.local..."
  cat > .env.local <<EOF
NEXT_PUBLIC_FORMSPREE_ENDPOINT=$FORMSPREE_ENDPOINT
EOF
else
  echo "[3/5] Keeping existing .env.local (no --formspree provided)..."
fi

echo "[4/5] Building project..."
npm run build

echo "[5/5] Restarting PM2 process..."
pm2 describe "$APP_NAME" >/dev/null 2>&1 || {
  echo "PM2 app '$APP_NAME' not found. Start it first with one-click-deploy.sh"
  exit 1
}

pm2 restart "$APP_NAME"
pm2 save

echo "Update complete."
echo "PM2: pm2 status"