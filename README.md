# Stubborn Stumps Website

Production-ready Next.js website for **Stubborn Stumps** (Invercargill, Southland, New Zealand).

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui-style components

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/your-form-id
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build for Production

```bash
npm run build
npm run start
```

## Pull / Update from GitHub (Single Script)

Use one script for both first-time clone and future updates:

```bash
bash scripts/sync-site.sh --dir /var/www/stubbornstumps
```

First-time server setup (install required dependencies + sync):

```bash
bash scripts/sync-site.sh --install-deps --dir /var/www/stubbornstumps
```

Debian workflow (if you install Nginx yourself):

```bash
cd /var/www
bash /root/sync-site.sh --install-deps --dir /var/www/stubbornstumps
```

How it works:

- If `/var/www/stubbornstumps` does not exist, it clones from GitHub.
- If `/var/www/stubbornstumps/.git` exists, it pulls the latest `main`.

Optional parameters:

```bash
bash scripts/sync-site.sh --repo https://github.com/samzcp99/stubbornstumps.git --branch main --dir /var/www/stubbornstumps
```

`--install-deps` currently supports Debian/Ubuntu servers and installs missing `git`, `curl`, and `rsync` (does not install `nginx`).

## One-Click VPS Deploy (Ubuntu)

This script installs all required server dependencies and deploys the app with PM2 + Nginx + SSL.

```bash
bash scripts/one-click-deploy.sh \
	--domain stubbornstumps.co.nz \
	--email samzcp99@gmail.com \
	--formspree https://formspree.io/f/your-form-id
```

What it installs/configures automatically:

- git, curl, nginx, certbot, python3-certbot-nginx, ufw
- Node.js 20 and PM2
- project dependencies via `npm ci`
- Nginx reverse proxy on port 80/443
- Let's Encrypt SSL with auto-redirect to HTTPS

## Routine Update (No Reinstall)

Use this after you push new code to GitHub. It only updates code, installs npm packages, rebuilds, and restarts PM2.

```bash
bash scripts/update-only.sh
```

If you need to change Formspree endpoint during an update:

```bash
bash scripts/update-only.sh --formspree https://formspree.io/f/your-form-id
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add `NEXT_PUBLIC_FORMSPREE_ENDPOINT` in Vercel Environment Variables.
4. Deploy.

## Static Website (Simple Deploy)

If you want zero Node.js runtime issues, deploy the static version in [static-site](static-site):

1. Upload all files under [static-site](static-site) to your server web root (e.g. `/var/www/html`).
2. Ensure Nginx serves that directory.
3. Update Formspree endpoint in [static-site/assets/js/site.js](static-site/assets/js/site.js).

Quick server update example:

```bash
cd /var/www/html
git pull origin main
sudo systemctl reload nginx
```
