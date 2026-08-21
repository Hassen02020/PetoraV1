# PETORA — Pet Food & Pet Supplies E-Commerce

Better care. Happier pets.

A transactional e-commerce platform for the US pet food & supplies market: catalog, cart, Stripe
checkout, customer accounts, Autoship subscriptions, pet profiles with recommendations, and an
admin back office.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (Postgres + Auth + RLS)
- **Stripe** (Checkout + Billing for Autoship)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe keys
npm run dev
```

## Database

Schema and RLS policies live in `supabase/migrations/`. Apply them to a Supabase project with the
Supabase CLI (`supabase db push`) or the SQL editor, in order.

## Deployment

Compatible with Vercel. Set the environment variables from `.env.example` in your hosting
provider and configure the Stripe webhook endpoint at `/api/webhooks/stripe`.
