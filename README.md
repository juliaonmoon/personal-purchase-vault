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

## Suggested stack

The exact stack is intentionally not locked yet. A sensible starting point is:

- Responsive web frontend / PWA
- API/backend service
- PostgreSQL
- Private object storage for receipts and warranty files
- Background worker / scheduler
- Transactional email
- Payment processor
- Pluggable document extraction / AI provider

## Status

Product definition / pre-MVP scaffold.
