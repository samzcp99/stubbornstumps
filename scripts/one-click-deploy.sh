#!/usr/bin/env bash

set -euo pipefail

DOMAIN=""
EMAIL=""
FORMSPREE_ENDPOINT=""
REPO_URL="https://github.com/samzcp99/stubbornstumps.git"
APP_DIR="/var/www/stubbornstumps"
APP_NAME="stubbornstumps"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --email)
      EMAIL="$2"
      shift 2
      ;;
    --formspree)
      FORMSPREE_ENDPOINT="$2"
      shift 2
      ;;
    --repo)
      REPO_URL="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage:"
      echo "  bash scripts/one-click-deploy.sh --domain stubbornstumps.co.nz --email you@example.com --formspree https://formspree.io/f/xxxxxxx"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$EMAIL" || -z "$FORMSPREE_ENDPOINT" ]]; then
  echo "Missing required args."
  echo "Required: --domain --email --formspree"
  echo "Run with --help for an example."
  exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required on this server."
  exit 1
fi

DEPLOY_USER="${SUDO_USER:-$USER}"

echo "[1/9] Installing system dependencies..."
sudo apt update
sudo apt -y upgrade
sudo apt install -y git curl nginx certbot python3-certbot-nginx ufw ca-certificates gnupg

echo "[2/9] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "[3/9] Installing PM2..."
sudo npm install -g pm2

echo "[4/9] Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "[5/9] Preparing app directory and source code..."
sudo mkdir -p "$APP_DIR"
sudo chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"

if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch --all --prune
  git -C "$APP_DIR" reset --hard origin/main
else
  rm -rf "$APP_DIR"
  mkdir -p "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "[6/9] Installing project dependencies and building..."
cd "$APP_DIR"
npm ci

cat > .env.local <<EOF
NEXT_PUBLIC_FORMSPREE_ENDPOINT=$FORMSPREE_ENDPOINT
EOF

npm run build

echo "[7/9] Starting app with PM2..."
pm2 describe "$APP_NAME" >/dev/null 2>&1 && pm2 delete "$APP_NAME" || true
pm2 start npm --name "$APP_NAME" -- start -- -p 3000
pm2 save
sudo env PATH="$PATH" pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER"

echo "[8/9] Writing Nginx config..."
sudo tee /etc/nginx/sites-available/$APP_NAME >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "[9/9] Issuing SSL certificate..."
sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -m "$EMAIL" --agree-tos --no-eff-email --redirect

echo "Deployment complete."
echo "Site: https://$DOMAIN"
echo "PM2: pm2 status"