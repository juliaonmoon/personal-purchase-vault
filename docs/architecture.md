# Architecture Notes

## Lean architecture

- **Web client:** responsive, mobile-first, PWA-friendly.
- **Application/API:** authentication, CRUD, search orchestration, billing hooks.
- **PostgreSQL:** structured data for users, purchases, items, deadlines, status, subscriptions, reminders.
- **Private object storage:** receipt/warranty images and PDFs.
- **Worker / queue:** asynchronous extraction and reminder jobs.
- **Transactional email:** verification and reminders.
- **Payments:** recurring plan billing.
- **Extraction adapter:** provider-neutral interface for OCR/vision/AI processing.

For a prototype, the web/API/worker can share one small compute host if appropriate. Keep object storage and transactional email separate. Split services only when justified by traffic/reliability.

## Processing pipeline

`upload -> validate -> private storage -> enqueue -> extraction -> normalize -> confidence checks -> user review -> save -> rules -> reminders -> search/inventory`

## Core entities

### User
`id, email, name, timezone, notification_preferences, plan`

### Household
`id, owner_id, default_currency`

### Purchase
`id, household_id, retailer, purchase_date, subtotal, tax, total, currency, order_number, receipt_number, source`

### PurchaseItem
`id, purchase_id, name, quantity, unit_price, category, brand, model, serial_number, image_document_id`

### Document
`id, household_id, purchase_id, purchase_item_id, type, object_key, filename, content_type, metadata`

### ReturnRecord
`purchase_item_id, deadline, policy_source, status, returned_at, refund_amount`

### Warranty
`purchase_item_id, provider, starts_at, ends_at, term, warranty_type, status, claim_notes`

### InventoryItem
`purchase_item_id, room, assigned_person, tags, condition, ownership_status, replacement_notes`

### Subscription
`id, household_id, purchase_item_id?, merchant, service_name, amount, currency, billing_frequency, trial_ends_at, renews_at, status`

### Reminder
`id, household_id, entity_type, entity_id, reminder_type, scheduled_at, channel, status, sent_at`

## Security / privacy

- No public receipt URLs.
- TLS everywhere.
- Signed short-lived object URLs.
- File type/size validation and malware/abuse controls where appropriate.
- Avoid retaining full payment-card data.
- Least privilege between services.
- Deletion workflow includes stored files.
- Backups and restore procedure.
- Clear privacy policy and processor disclosure.
- Rate limiting and upload quotas.
- Policy/date inference must expose source/confidence and remain editable.

## Important implementation choices to keep open

- Frontend framework.
- Backend framework/runtime.
- Auth provider vs first-party auth.
- VPS vs managed application host.
- Managed vs self-hosted PostgreSQL.
- Object storage provider.
- Transactional email provider.
- Payment processor.
- Extraction provider(s).

Do not lock these until cost, deployment simplicity, and developer preference are compared.
