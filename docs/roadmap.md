# Roadmap

Stack and data model are locked — see `docs/decisions.md` (ADR-001 through ADR-007). Phase 0 (landing-page validation) is skipped; we're building the real vertical slice directly per the working instruction to reach a genuinely usable MVP.

## Milestone 1 — Core vertical slice (in progress)

Everything needed for: sign up → upload → extract → review/correct → save purchase+items → assign return/warranty → auto-inventory → schedule reminders → receive email → find it again in the vault. Combines the original Phase 1–3.

1. **Schema + RLS** — `supabase/migrations/0001_init.sql` (all tables per decisions.md), `0002_storage.sql` (private `documents` bucket + folder-scoped RLS).
2. **Auth** — Supabase email/password via `@supabase/ssr`, `src/proxy.ts` session refresh + route protection, login/signup pages, email confirmation callback.
3. **Upload + extraction pipeline** — API route: validate file → store in private bucket → create `documents` row → call the extraction provider → store `extraction_results` → return structured data to the client.
4. **Review + save** — editable form pre-filled from extraction; on submit, creates `purchases` + `purchase_items` rows (server action, idempotency key from the upload step).
5. **Return/warranty + auto-inventory** — per-item deadline/warranty fields; saving creates `returns`/`warranties` rows, creates `inventory_items` for durable goods, and creates `reminders` rows at fixed offsets (7d + 1d before return deadline; 30d + 7d before warranty end).
6. **Reminder delivery** — `api/cron/reminders` route (Vercel Cron), service-role client, idempotent (claim-then-send pattern: flip `status` to `sent` in the same query that selects due reminders), sends via Resend.
7. **Dashboard** — upcoming deadlines + recent purchases.
8. **Vault** — search/filter purchases and items.
9. **Purchase detail** — line items, signed-URL receipt retrieval, return/warranty status, mark-as-actioned controls.
10. **Inventory view** — durable goods grid.

**Acceptance = the criteria already listed in `docs/requirements.md` §10.** Not done until all of those pass against the real running app, not just individual pieces.

**Explicitly not in Milestone 1** (matches requirements §4/§5 and the original Phase 4/5/6 split): subscriptions/trials, email-forward-to-vault, billing/plan limits, retailer policy lookup, claim assistance, price monitoring.

## Milestone 2 — Subscriptions (was Phase 4)
Recurring-service records, trial/renewal tracking, reminders reusing the Milestone 1 reminder engine.

## Milestone 3 — Monetization (was Phase 5)
Free tier limits, paid plan, Stripe billing, storage/upload quotas.

## Later (was Phase 6)
Retailer policy lookup, warranty claim guidance, price-drop monitoring, insurance-ready inventory export, shared household accounts (see ADR-002 for the migration path), native apps.
