# Product Requirements

## 1. Vision

Personal Purchase Vault is an automatic memory for purchases. Users upload receipts, invoices, order confirmations, warranty documents, or product photos. The system extracts useful information, organizes it, tracks important dates, and reminds users before action is needed.

## 2. Target jobs

- Remember purchase details so the user does not have to.
- Warn before return, warranty, trial, or renewal deadlines.
- Retrieve proof of purchase in seconds when something breaks.
- Maintain a home inventory without a spreadsheet.
- Track recurring services and upcoming renewals.

## 3. MVP must-haves

- Account creation and secure sign-in.
- Mobile/desktop upload of JPG, PNG, and PDF.
- Extraction of retailer, purchase date, items, quantities, prices, taxes, total, receipt/order number, and visible non-sensitive payment metadata where useful.
- Editable extracted fields.
- One purchase with multiple line items.
- Secure original-document storage linked to records.
- Return deadline and status.
- Warranty start/end dates and status.
- Searchable purchase vault.
- Basic home inventory generated from eligible durable goods.
- Email reminders.
- Dashboard with upcoming deadlines and recent purchases.
- Account data export/deletion.

## 4. Should-haves

- Forward-to-vault email address for online receipts.
- Automatic category detection.
- Product photo, model, and serial-number capture.
- Multiple configurable reminder offsets.
- Household tags / room / person labels.
- Detection or easy entry of recurring subscriptions and trials.

## 5. Later

- Retailer policy lookup and automatic return-window calculation.
- Warranty claim assistant.
- Price-drop / price-adjustment monitoring.
- Credit-card extended-warranty matching.
- Insurance-ready inventory reports.
- Shared household accounts.
- Native iOS/Android apps and push notifications.

## 6. Core flows

### Add purchase

1. User taps **Add Purchase**.
2. User takes a photo or uploads a receipt/PDF/order confirmation.
3. System processes it and shows extracted fields.
4. User reviews/corrects fields.
5. System creates purchase + line-item records.
6. User confirms return/warranty information.
7. Eligible items are added to inventory.
8. Reminders are scheduled.
9. Original document remains linked to the purchase.

### Deadline reminder

1. User receives reminder.
2. Reminder deep-links to the exact item/purchase.
3. Record shows proof of purchase, seller, amount, relevant dates, and suggested action.
4. User marks the outcome: returned, claimed, cancelled, renewed, ignored, etc.

### Something breaks

1. User searches product/category/retailer/model/date/tag.
2. App returns matching item.
3. User sees receipt and warranty status immediately.

## 7. Screens

### Dashboard
Upcoming deadlines, recent purchases, active warranties, recurring renewals, and prominent **Add Purchase** action.

### Add Purchase
Camera/upload options, processing state, extraction review.

### Purchase Detail
Retailer/order summary, line items, receipt preview, return status, warranty status, reminders, notes, actions.

### Vault
Search/filter purchases by item, retailer, category, date, amount, status, tag.

### Inventory
Owned durable goods with room/person/category, purchase date/price, model/serial, warranty status, proof.

### Subscriptions
Recurring services, amount/frequency, trial end, next renewal, status.

### Reminders
Upcoming/completed reminders for returns, warranties, trials, renewals, custom dates.

### Settings
Profile, timezone, notifications, billing, export/delete, privacy/security.

## 8. Functional requirements

- **FR-01 Authentication:** create account, sign in/out, reset credentials; optional identity providers.
- **FR-02 Upload:** JPG/PNG/PDF and mobile camera capture.
- **FR-03 Extraction:** normalize document contents into structured purchase data.
- **FR-04 Correction:** user can review/edit every extracted field.
- **FR-05 Purchase model:** one purchase has multiple line items.
- **FR-06 Documents:** private document storage linked to purchase/item.
- **FR-07 Returns:** deadline, policy/source notes, reminders, lifecycle status.
- **FR-08 Warranties:** provider, term, dates, documents, status, claim notes.
- **FR-09 Inventory:** durable items can become inventory records automatically/manually.
- **FR-10 Subscriptions:** merchant/service, amount, frequency, trial end, renewal, status.
- **FR-11 Notifications:** configurable email reminders; later push/SMS.
- **FR-12 Search:** item, retailer, date, category, tag, model/serial, notes.
- **FR-13 Lifecycle:** return/warranty/subscription/inventory statuses.
- **FR-14 Portability:** export records and delete account/data.
- **FR-15 Billing:** free/paid plans and enforce upload/storage/processing limits.

## 9. Non-functional requirements

- Mobile-first responsive UI.
- Upload processing is retry-safe and avoids duplicate records.
- Reminder delivery is idempotent.
- Respect user timezone.
- Multi-currency-ready data model.
- Accessible labels, keyboard navigation, contrast, and status text.
- Operational/error logging without unnecessarily exposing receipt content.

## 10. Acceptance criteria for first usable MVP

- New user can create an account and upload a receipt from a phone.
- Main purchase fields are extracted and editable.
- Original receipt can be retrieved later.
- A line item can have a return deadline and warranty expiration.
- A reminder can be scheduled and delivered.
- Item appears in search and, if eligible, home inventory.
- User can search an item and reach proof of purchase quickly.
- User can delete a purchase/document and request account deletion.
- Core flow works on current desktop and mobile browsers.
