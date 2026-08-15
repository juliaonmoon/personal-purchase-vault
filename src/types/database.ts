// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Regenerate/replace with `supabase gen types typescript` once a live project exists.

export type Currency = string; // ISO 4217, e.g. 'CAD', 'USD'

export type PurchaseSource = 'upload' | 'email_forward' | 'manual';
export type DocumentType = 'receipt' | 'warranty' | 'product_photo' | 'other';
export type ExtractionStatus = 'pending' | 'succeeded' | 'failed';
export type ReturnStatus = 'open' | 'returned' | 'expired' | 'not_eligible';
export type WarrantyType = 'manufacturer' | 'extended' | 'store';
export type WarrantyStatus = 'active' | 'expired' | 'claimed';
export type OwnershipStatus = 'owned' | 'sold' | 'disposed' | 'lost';
export type BillingFrequency = 'weekly' | 'monthly' | 'yearly' | 'custom';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled';
export type ReminderKind =
  | 'return_deadline'
  | 'warranty_expiration'
  | 'subscription_renewal'
  | 'trial_end'
  | 'custom';
export type ReminderChannel = 'email' | 'push' | 'sms';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type Plan = 'free' | 'personal' | 'household';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
  default_currency: Currency;
  notification_prefs: { email: boolean };
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  purchase_id: string | null;
  doc_type: DocumentType;
  storage_key: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
}

export interface ExtractionResult {
  id: string;
  document_id: string;
  provider: string;
  status: ExtractionStatus;
  structured_output: ExtractedPurchaseData | null;
  raw_response: unknown;
  confidence: number | null;
  error_message: string | null;
  created_at: string;
}

// Shape returned by the AI/OCR provider abstraction (src/lib/extraction).
export interface ExtractedPurchaseData {
  retailer: string | null;
  purchase_date: string | null; // ISO date
  subtotal_cents: number | null;
  tax_cents: number | null;
  total_cents: number | null;
  currency: string | null;
  order_number: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unit_price_cents: number | null;
    category: string | null;
    brand: string | null;
    model: string | null;
  }>;
}

export interface Purchase {
  id: string;
  user_id: string;
  retailer: string | null;
  purchase_date: string | null;
  subtotal_cents: number | null;
  tax_cents: number | null;
  total_cents: number | null;
  currency: Currency;
  order_number: string | null;
  source: PurchaseSource;
  notes: string | null;
  upload_idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  name: string;
  quantity: number;
  unit_price_cents: number | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  image_document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReturnRecord {
  id: string;
  item_id: string;
  deadline_date: string;
  policy_notes: string | null;
  status: ReturnStatus;
  returned_date: string | null;
  refund_amount_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface Warranty {
  id: string;
  item_id: string;
  provider: string | null;
  warranty_type: WarrantyType;
  start_date: string | null;
  end_date: string;
  term_months: number | null;
  status: WarrantyStatus;
  claim_notes: string | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  location_tag: string | null;
  condition: string | null;
  ownership_status: OwnershipStatus;
  replacement_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  purchase_id: string | null;
  merchant_name: string;
  amount_cents: number | null;
  currency: Currency;
  billing_frequency: BillingFrequency;
  trial_end_date: string | null;
  next_renewal_date: string | null;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  kind: ReminderKind;
  return_id: string | null;
  warranty_id: string | null;
  subscription_id: string | null;
  scheduled_for: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  sent_at: string | null;
  created_at: string;
}
