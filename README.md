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

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add `NEXT_PUBLIC_FORMSPREE_ENDPOINT` in Vercel Environment Variables.
4. Deploy.
