# QR Operations SaaS

Customer-login QR SaaS for branded codes, saved libraries, dynamic redirect links, and scan tracking.

This project is being built as a scalable multi-tenant SaaS application for recurring subscription revenue and future acquisition readiness. See `SAAS-ACQUISITION-READINESS.md` for the product roadmap and enterprise feature checklist.

It is also being shaped as a low-maintenance automated SaaS. See `LOW-MAINTENANCE-SAAS-OPERATIONS.md` for the operating model.

## Local Setup

```powershell
Copy-Item .env.example .env.local
npm run dev
```

Fill `.env.local` with Supabase keys before using auth or the dashboard.

## Supabase

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. In Vercel, add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Customer Pricing

The included SaaS pricing is competitive for branded QR tools:

- Free Trial: 10 dynamic QR codes, 1 user, and basic analytics.
- Starter: $12 monthly, $34 quarterly, or $120 yearly after a 14-day free trial. Includes 25 QR codes, 3 users, dynamic QR management, and basic analytics.
- Professional: $29 monthly, $82 quarterly, or $290 yearly after a 14-day free trial. Includes 100 QR codes, 5 users, advanced analytics, branding customization, and export reporting.
- Business: $79 monthly, $225 quarterly, or $790 yearly after a 14-day free trial. Includes 500 QR codes, 500 users, API access, white-label functionality, bulk QR uploads, team permissions, and advanced exports.
- Enterprise: custom pricing with unlimited or custom QR limits, unlimited or custom users, custom integrations, SLA support, and enterprise onboarding.

Saved scan history is limited by plan, but QR redirects continue to work so printed customer materials do not break.

## Stripe Payments

Use Stripe to accept customer payments. The app never stores card numbers; Stripe Checkout handles the secure payment page.

1. Create or log into a Stripe account.
2. Create four subscription products: Starter, Pro, Business, and Agency.
3. Add monthly, quarterly, and yearly recurring prices for each product.
4. Copy each Stripe Price ID into Vercel using the matching environment variable from `.env.example`.
5. Add `STRIPE_SECRET_KEY` in Vercel.
6. Add a Stripe webhook endpoint pointing to:

```text
https://your-domain.com/api/stripe/webhook
```

7. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.
8. Redeploy Vercel.

Enable Stripe Customer Portal in Stripe so customers can self-manage payment methods, invoices, upgrades, downgrades, and cancellations from the dashboard.

If you sell this site to another business, they only need to replace the Supabase and Stripe environment variables in Vercel with their own. That makes the app point to their database and their payment account.

## Owner Dashboard

Open `/owner` after logging in with an owner email. Add this Vercel environment variable:

```text
OWNER_EMAILS=you@yourcompany.com
```

To receive new-account alerts, add a Zapier, Make, Slack, Discord, or webhook URL:

```text
OWNER_ALERT_WEBHOOK_URL=https://your-webhook-url
```

The owner dashboard shows accounts, plans, QR usage, and scan totals. Customers cannot access it unless their email is listed in `OWNER_EMAILS`.

## Setup Assistant

The app includes a setup helper for customers and operators. It works with built-in FAQ answers by default.

For AI-powered answers, add:

```text
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.2
```

The assistant uses OpenAI's Responses API when an API key is available.

## Vercel

This is now a Next.js app. Vercel can detect it automatically.

Build command:

```text
npm run build
```

Health check for uptime monitoring:

```text
https://your-domain.com/api/health
```

## Desktop Build

```powershell
npm run build:win
```

The packaged Windows app is generated in `dist/`. The desktop build is still available for one-off customer packaging.
