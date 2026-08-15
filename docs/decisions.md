# Architecture Decision Log

Use this file to record decisions that materially affect cost, portability, security, or developer workflow.

## Template

### ADR-XXX — Decision title
- **Status:** Proposed / Accepted / Superseded
- **Context:**
- **Decision:**
- **Alternatives considered:**
- **Consequences:**

---

### ADR-001 — Lock MVP stack to Next.js + Supabase + Vercel
- **Status:** Accepted
- **Context:** `docs/architecture.md` intentionally left the stack open pending a cost/complexity comparison. Implementation cannot start without a decision.
- **Decision:** TypeScript, Next.js (App Router) frontend + API routes, Supabase for Postgres + Auth + private object storage + row-level security, deployed on Vercel. Transactional email via Resend. Receipt extraction via Claude's vision API behind a provider interface. Payments (Phase 5, not MVP) via Stripe when needed.
- **Alternatives considered:**
  - **FastAPI + Postgres + separate Next.js frontend** — matches an existing project's stack, but requires running and deploying two services plus a background worker for a solo-maintained MVP. More moving parts for no MVP-stage benefit.
  - **Self-hosted VPS** (Node or Python, self-managed Postgres/object storage) — cheapest raw compute, but owner carries backups, TLS, and deploy pipeline manually. Conflicts with the "low-maintenance" and "simple deployment" product requirements.
- **Consequences:** Auth, storage, and RLS-based privacy come essentially for free from Supabase, at the cost of light platform lock-in. Background jobs (extraction, reminders) run as Vercel Cron hitting API routes rather than a dedicated worker/queue — acceptable at MVP volume; revisit if job volume or latency needs grow.

### ADR-002 — Defer Household entity; scope MVP data to user_id
- **Status:** Accepted
- **Context:** `docs/architecture.md` puts `household_id` on Purchase, Subscription, and Reminder. Household/shared-account support is explicitly listed as post-MVP in `docs/requirements.md` (§5, Later).
- **Decision:** MVP tables use `user_id` directly (owner = `auth.users.id`). No Household table in the initial schema.
- **Alternatives considered:** Building the Household table now with a single implicit member (the owner) so a later "add a member" feature needs no schema change. Rejected: it adds a join to every RLS policy and every query for a feature that doesn't exist yet.
- **Consequences:** Adding shared households later is an additive migration — a new `households` table, a `household_id` column added to the existing user-scoped tables, and updated RLS policies. It does not require touching the Purchase/Item/Return/Warranty model itself.

### ADR-003 — Store all money as integer cents
- **Status:** Accepted
- **Context:** `docs/architecture.md` lists `subtotal, tax, total` without a numeric type. Multi-currency support is required from the start (requirements §9).
- **Decision:** Every monetary column (`subtotal_cents`, `tax_cents`, `total_cents`, `unit_price_cents`, `amount_cents`, `refund_amount_cents`) is a Postgres `integer` storing minor currency units. Currency is a separate `char(3)` ISO 4217 column alongside each money column (not a single account-wide currency), since one user's purchases can span currencies.
- **Alternatives considered:** `numeric(10,2)` — avoids a mental "divide by 100" step in queries, but decimal arithmetic in JS at the API layer reintroduces float rounding risk when the ORM round-trips values as JS numbers.
- **Consequences:** All money enters/leaves the app through `src/lib/money.ts`, the single place that converts between cents and a user-facing dollar string.

### ADR-004 — Reminder uses explicit nullable FKs, not a polymorphic entity reference
- **Status:** Accepted
- **Context:** `docs/architecture.md` defines Reminder as `entity_type, entity_id` (polymorphic). Reminder idempotency is a hard NFR requirement.
- **Decision:** `reminders` has three nullable FK columns — `return_id`, `warranty_id`, `subscription_id` — with a check constraint that at most one is set (`custom` reminders may have none). Each FK cascades on delete from its parent.
- **Alternatives considered:** Keep `entity_type/entity_id` — more extensible to new reminder targets without a migration, but Postgres cannot enforce that `entity_id` actually references a live row of the claimed type, and a bug or manual data fix can silently create an orphaned reminder that never gets cleaned up.
- **Consequences:** Adding a new reminder target (e.g. a custom user-set date unrelated to any entity) needs a new nullable column and constraint update — a small, explicit migration, not a schema redesign.

### ADR-005 — Document ownership: purchase-level by default, item-level via explicit link
- **Status:** Accepted
- **Context:** `docs/architecture.md` gives Document both `purchase_id` and `purchase_item_id`, with no rule for which one is authoritative when both could apply.
- **Decision:** `documents.purchase_id` is the only ownership FK (nullable until the purchase is created, since a document is uploaded and extracted before a purchase record exists). An item-level product photo is linked from the item's side instead: `purchase_items.image_document_id`. A warranty document is linked the same way: `warranties.document_id`.
- **Consequences:** Every document has exactly one clear owner path to query from; there's no ambiguity about which FK is authoritative when both could theoretically be set.

### ADR-006 — Store raw + structured AI extraction output
- **Status:** Accepted
- **Context:** Requirements say inferred data must "preserve source/confidence" and remain editable; architecture doesn't have a table for this. Extraction providers must be swappable (CLAUDE.md, requirements) without losing history of what a prior provider produced.
- **Decision:** New `extraction_results` table: `document_id`, `provider`, `status`, `structured_output` (jsonb), `raw_response` (jsonb), `confidence`, `error_message`. One row per extraction attempt.
- **Consequences:** Enables re-processing a document with a new provider later, debugging bad extractions from real user data, and (later) measuring per-provider accuracy — without adding any of that complexity to the Purchase/Item tables themselves.

### ADR-007 — Upload idempotency key on Purchase
- **Status:** Accepted
- **Context:** NFR: "Upload processing is retry-safe and avoids duplicate records." Nothing in the current data model enforces this.
- **Decision:** `purchases.upload_idempotency_key` (nullable, unique per user when set). The client generates a key per upload attempt; a retried request with the same key updates rather than duplicates the purchase.
- **Consequences:** One unique partial index (`where upload_idempotency_key is not null`) is the entire cost of this guarantee.
