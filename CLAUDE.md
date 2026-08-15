# Claude Code Project Context

## Goal

Build **Personal Purchase Vault**, a low-maintenance consumer micro-SaaS that remembers purchase information users normally lose or forget.

The product combines:

1. Receipt vault
2. Return-deadline tracking
3. Warranty tracking
4. Subscription/trial tracking
5. Home inventory

The primary experience is not five separate tools. **One uploaded purchase should feed all applicable functions.**

Example: a user uploads a laptop receipt. The system stores the proof of purchase, extracts the laptop and price, creates the purchase/item record, lets the user confirm a return deadline and warranty period, schedules reminders, and adds the laptop to home inventory.

## Product promise

> Upload it. Forget it. We'll remember.

## MVP boundary

Build the smallest end-to-end loop first:

`mobile upload -> extraction -> editable purchase/item -> secure document -> return/warranty dates -> reminders -> search/retrieval`

Do NOT start with:

- retailer scraping at scale
- bank integrations
- native mobile apps
- automated warranty filing
- price monitoring
- social/community features
- a content library

## Important product rules

- Mobile-first responsive web.
- A purchase can contain multiple line items.
- Return/warranty status belongs at item level where appropriate.
- Never treat inferred retailer/warranty policy as guaranteed. Preserve source/confidence and allow correction.
- Original files must remain private.
- Do not retain unnecessary payment-card information from receipts.
- User data must be exportable and deletable.
- Reminder jobs must be idempotent.
- Support user timezone and multiple currencies from the beginning.

## Suggested implementation order

1. Auth
2. Private document upload/storage
3. Purchase + line-item data model
4. Extraction pipeline with editable review screen
5. Purchase detail + searchable vault
6. Return/warranty dates
7. Reminder scheduler + email
8. Home inventory projection from durable items
9. Subscription/trial records
10. Billing and plan limits

## Collaboration expectation

When making implementation choices, prefer boring, inexpensive, well-supported components and keep provider-specific integrations behind abstractions. Document meaningful architecture decisions in `docs/decisions.md`.

Before coding large features, read `docs/requirements.md` and `docs/architecture.md`.
