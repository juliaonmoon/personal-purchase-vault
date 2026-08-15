# Personal Purchase Vault

**Working promise:** Upload it. Forget it. We'll remember.

A consumer self-service web app that turns receipts, order confirmations, warranty documents, and product photos into a searchable purchase memory. One upload can power receipt storage, return tracking, warranty reminders, subscription awareness, and home inventory.

## Core product

- Receipt & purchase vault
- Return deadline tracking
- Warranty tracking
- Subscription / trial tracking
- Home inventory
- Automated reminders

## MVP

The first end-to-end loop is:

1. Sign in.
2. Upload a receipt/image/PDF.
3. Extract retailer, date, line items, totals, and identifiers.
4. Let the user correct extracted data.
5. Store the original document securely.
6. Add return and warranty dates.
7. Schedule reminders.
8. Make the purchase and item searchable.
9. Add durable items to home inventory.

See [`docs/requirements.md`](docs/requirements.md) and [`docs/architecture.md`](docs/architecture.md).

## Product principles

- Mobile-first web app before native apps.
- One upload should create multiple useful records automatically.
- Self-service and low operational overhead.
- No recurring content-production requirement.
- Do not overbuild before validating repeat usage and willingness to pay.

## Stack

Locked in [`docs/decisions.md`](docs/decisions.md) (ADR-001):

- Next.js (App Router, TypeScript) — frontend + API routes, deployed on Vercel
- Supabase — Postgres, Auth, private object storage, row-level security
- Claude vision API — receipt/document extraction, behind a provider interface (`src/lib/extraction`)
- Resend — transactional email for reminders
- Vercel Cron — reminder delivery job

## Getting started

1. Create a Supabase project, then in the SQL editor run the migrations in `supabase/migrations/` in order (or `supabase db push` with the CLI).
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL/keys, an `ANTHROPIC_API_KEY`, a `RESEND_API_KEY`, and a `CRON_SECRET`.
3. `npm install && npm run dev`, then visit `http://localhost:3000`.
4. To exercise the reminder cron locally: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders`.

## Status

Milestone 1 (core vertical slice) implemented — see [`docs/roadmap.md`](docs/roadmap.md). Not yet deployed; needs a live Supabase project and API keys to run end-to-end.
