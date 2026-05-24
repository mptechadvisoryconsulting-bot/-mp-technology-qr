# ScanOps Technical Operations

ScanOps is a multi-tenant SaaS platform for operational QR automation. MP Technology Consulting is the parent company and infrastructure owner; public product branding should remain ScanOps.

## Runtime

- Next.js application deployed on Vercel.
- Supabase/PostgreSQL stores accounts, profiles, QR codes, scan events, subscriptions, support tickets, audit logs, and API keys.
- Stripe handles subscriptions, billing portal access, invoices, plan changes, and payment lifecycle webhooks.
- Cloudflare should front production domains for DNS, CDN, SSL, WAF, bot protection, and rate limiting.

## Production Domains

- Marketing: `https://scanops.io`
- App: `https://app.scanops.io`
- Dashboard: `https://dashboard.scanops.io`
- API: `https://api.scanops.io`

Set `NEXT_PUBLIC_SITE_URL` to the domain that should appear inside generated QR links. For production this should normally be `https://app.scanops.io`.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_MARKETING_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_*`
- `OWNER_EMAILS`

## Billing Behavior

- First-time accounts can receive a 14-day trial.
- Existing subscriptions are updated in Stripe with proration instead of starting a new trial.
- Stripe webhooks update Supabase subscription rows and account plan limits.
- The customer billing portal is the preferred self-service location for invoice history, payment methods, and cancellation.

## QR Redirect Behavior

- Dynamic QR codes use `/?qr={shortCode}`.
- Short codes preserve uppercase letters, lowercase letters, numbers, dots, dashes, and underscores.
- Custom aliases must be unique.
- Paused, expired, missing, or suspended-account QR codes return a branded not-found page instead of falling back to the app dashboard.

## Admin Operations

The owner dashboard at `/owner` requires `OWNER_EMAILS`. Admins can view accounts and suspend or restore account access. Suspensions are audit logged.

## Reliability Checklist

- Enable Supabase automated backups.
- Configure Vercel production and preview deployments.
- Put Cloudflare in front of ScanOps domains.
- Add uptime monitoring for `/api/health`.
- Add centralized error logging with Sentry or similar.
- Keep staging and production environment variables separate.
