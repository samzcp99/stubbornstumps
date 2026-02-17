# Stubborn Stumps Website

Static HTML/CSS/JS website for **Stubborn Stumps** (Invercargill, Southland, New Zealand).

## Stack

- HTML pages
- `assets/css/styles.css`
- `assets/js/site.js`
- Formspree endpoint for quote form submissions

## Configure Form Submission

Set your real Formspree endpoint in `assets/js/site.js`:

```js
const FORMSPREE_ENDPOINT = "https://formspree.io/f/your-form-id";
```

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
- Set real Formspree endpoint in `assets/js/site.js`
- Replace placeholder gallery images in `assets/images/`
- Validate `robots.txt` and `sitemap.xml` after major content updates
- Run server sync: `bash /root/sync-site.sh --dir /var/www/stubbornstumps`
