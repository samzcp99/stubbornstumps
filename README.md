# Stubborn Stumps Website

Static HTML/CSS/JS website for **Stubborn Stumps** (Invercargill, Southland, New Zealand).

## Stack

- HTML pages
- `assets/css/styles.css`
- `assets/js/site.js`
- Local PHP API (`api/quote.php`) + SQLite for quote submissions

## Configure Local Form Backend (No Formspree Quota)

The quote form now submits to `api/quote.php` on your own server.

Server requirements (Debian/Ubuntu):

```bash
sudo apt update
sudo apt install -y php-fpm php-sqlite3
```

Nginx must route PHP requests to PHP-FPM (example snippet):

```nginx
location ~ \.php$ {
	include snippets/fastcgi-php.conf;
	fastcgi_pass unix:/run/php/php8.2-fpm.sock;
}
```

After changing Nginx config:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Ensure writable storage directory for database and uploads:

```bash
sudo chown -R www-data:www-data /var/www/stubbornstumps/storage
sudo chmod -R 775 /var/www/stubbornstumps/storage
```

### Email Notifications (Optional but Recommended)

The API can send email after successful quote submission via PHP `mail()`.

1) Create a local server-only config file:

```bash
cp /var/www/stubbornstumps/api/config.example.php /var/www/stubbornstumps/api/config.local.php
```

2) Edit `api/config.local.php` and set:

- `enabled` => `true`
- `to` => your inbox
- `from` => a valid sender address for your domain
- `customerConfirmation` => `true` or `false`

3) Install a sendmail-compatible relay (example using msmtp):

```bash
sudo apt install -y msmtp msmtp-mta mailutils
```

4) Configure `/etc/msmtprc` with your SMTP provider credentials, then:

```bash
sudo chmod 600 /etc/msmtprc
sudo systemctl restart php8.4-fpm
```

After this, each new quote writes to SQLite and sends a notification email.

Optional fallback: you can still set a Formspree endpoint in `assets/js/site.js` as backup.

## Local Preview

Open `index.html` directly in a browser, or serve the folder with any static server.

## Server Sync Script (Clone + Pull)

Use one command for first deploy and all future updates:

```bash
bash scripts/sync-site.sh --dir /var/www/stubbornstumps
```

Install missing dependencies on Debian/Ubuntu during first setup:

```bash
bash scripts/sync-site.sh --install-deps --dir /var/www/stubbornstumps
```

Optional parameters:

```bash
bash scripts/sync-site.sh --repo https://github.com/samzcp99/stubbornstumps.git --branch main --dir /var/www/stubbornstumps
```

## Content Data Files

- Address autocomplete local hints: `assets/data/southland-address-hints.json`

Update this JSON file to improve local suggestion quality without changing JavaScript.

## Launch Checklist

- Replace placeholder phone number with real number across all pages
- Confirm PHP + SQLite are installed on the server
- Confirm `storage/` directory is writable by Nginx/PHP user
- Replace placeholder gallery images in `assets/images/`
- Validate `robots.txt` and `sitemap.xml` after major content updates
- Run server sync: `bash /root/sync-site.sh --dir /var/www/stubbornstumps`
