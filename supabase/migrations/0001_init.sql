-- Personal Purchase Vault: initial schema
-- All money stored as integer minor units (cents) to avoid float rounding errors.
-- All tables are scoped to auth.uid() via RLS; the app must never bypass RLS with the anon/user key.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users, holds app-level user settings)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  timezone text not null default 'America/Vancouver',
  default_currency char(3) not null default 'CAD',
  notification_prefs jsonb not null default '{"email": true}'::jsonb,
  plan text not null default 'free' check (plan in ('free', 'personal', 'household')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Generic updated_at maintenance.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- documents (private files in Supabase Storage; purchase_id is nullable
-- because a document is uploaded and processed before a purchase exists)
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid, -- FK added after purchases table exists
  doc_type text not null default 'receipt' check (doc_type in ('receipt', 'warranty', 'product_photo', 'other')),
  storage_key text not null, -- path within the private 'documents' bucket
  file_name text not null,
  mime_type text not null,
  file_size_bytes integer not null,
  created_at timestamptz not null default now()
);

create index documents_user_id_idx on public.documents(user_id);
create index documents_purchase_id_idx on public.documents(purchase_id);

-- ---------------------------------------------------------------------------
-- extraction_results (raw + structured AI output, kept for audit/reprocessing
-- and so the AI/OCR provider can be swapped without losing history)
-- ---------------------------------------------------------------------------
create table public.extraction_results (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  provider text not null, -- e.g. 'anthropic-claude-vision'
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  structured_output jsonb,
  raw_response jsonb,
  confidence numeric(3,2),
  error_message text,
  created_at timestamptz not null default now()
);

create index extraction_results_document_id_idx on public.extraction_results(document_id);

-- ---------------------------------------------------------------------------
-- purchases
-- ---------------------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  retailer text,
  purchase_date date,
  subtotal_cents integer,
  tax_cents integer,
  total_cents integer,
  currency char(3) not null default 'CAD',
  order_number text,
  source text not null default 'upload' check (source in ('upload', 'email_forward', 'manual')),
  notes text,
  upload_idempotency_key text, -- prevents duplicate purchases from retried uploads
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index purchases_user_idempotency_key_idx
  on public.purchases(user_id, upload_idempotency_key)
  where upload_idempotency_key is not null;

create index purchases_user_id_idx on public.purchases(user_id);

create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute procedure public.set_updated_at();

alter table public.documents
  add constraint documents_purchase_id_fkey
  foreign key (purchase_id) references public.purchases(id) on delete set null;

-- ---------------------------------------------------------------------------
-- purchase_items (one purchase -> many items; each item can carry its own
-- return/warranty/inventory status)
-- ---------------------------------------------------------------------------
create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  unit_price_cents integer,
  category text,
  brand text,
  model text,
  serial_number text,
  image_document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchase_items_purchase_id_idx on public.purchase_items(purchase_id);

create trigger purchase_items_set_updated_at
  before update on public.purchase_items
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- returns (1:1 with purchase_items)
-- ---------------------------------------------------------------------------
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.purchase_items(id) on delete cascade,
  deadline_date date not null,
  policy_notes text,
  status text not null default 'open' check (status in ('open', 'returned', 'expired', 'not_eligible')),
  returned_date date,
  refund_amount_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger returns_set_updated_at
  before update on public.returns
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- warranties (1:1 with purchase_items)
-- ---------------------------------------------------------------------------
create table public.warranties (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.purchase_items(id) on delete cascade,
  provider text,
  warranty_type text not null default 'manufacturer' check (warranty_type in ('manufacturer', 'extended', 'store')),
  start_date date,
  end_date date not null,
  term_months integer,
  status text not null default 'active' check (status in ('active', 'expired', 'claimed')),
  claim_notes text,
  document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger warranties_set_updated_at
  before update on public.warranties
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- inventory_items (1:1 with purchase_items; created automatically for
-- durable goods, editable/removable by the user)
-- ---------------------------------------------------------------------------
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.purchase_items(id) on delete cascade,
  location_tag text, -- e.g. "Kitchen", "Sara", "Office"
  condition text,
  ownership_status text not null default 'owned' check (ownership_status in ('owned', 'sold', 'disposed', 'lost')),
  replacement_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions (recurring charges; may originate from a purchase or be
-- entered manually)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete set null,
  merchant_name text not null,
  amount_cents integer,
  currency char(3) not null default 'CAD',
  billing_frequency text not null default 'monthly' check (billing_frequency in ('weekly', 'monthly', 'yearly', 'custom')),
  trial_end_date date,
  next_renewal_date date,
  status text not null default 'active' check (status in ('trial', 'active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reminders (explicit nullable FKs rather than a polymorphic entity_id, so
-- Postgres still enforces referential integrity)
-- ---------------------------------------------------------------------------
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('return_deadline', 'warranty_expiration', 'subscription_renewal', 'trial_end', 'custom')),
  return_id uuid references public.returns(id) on delete cascade,
  warranty_id uuid references public.warranties(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  scheduled_for timestamptz not null,
  channel text not null default 'email' check (channel in ('email', 'push', 'sms')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reminders_single_reference check (
    num_nonnulls(return_id, warranty_id, subscription_id) <= 1
  )
);

create index reminders_due_idx on public.reminders(scheduled_for) where status = 'pending';
create index reminders_user_id_idx on public.reminders(user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: every table is scoped to the owning user.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.extraction_results enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.returns enable row level security;
alter table public.warranties enable row level security;
alter table public.inventory_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reminders enable row level security;

create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "documents_owner" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "extraction_results_owner" on public.extraction_results
  for all using (
    document_id in (select id from public.documents where user_id = auth.uid())
  ) with check (
    document_id in (select id from public.documents where user_id = auth.uid())
  );

create policy "purchases_owner" on public.purchases
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "purchase_items_owner" on public.purchase_items
  for all using (
    purchase_id in (select id from public.purchases where user_id = auth.uid())
  ) with check (
    purchase_id in (select id from public.purchases where user_id = auth.uid())
  );

create policy "returns_owner" on public.returns
  for all using (
    item_id in (
      select pi.id from public.purchase_items pi
      join public.purchases p on p.id = pi.purchase_id
      where p.user_id = auth.uid()
    )
  ) with check (
    item_id in (
      select pi.id from public.purchase_items pi
      join public.purchases p on p.id = pi.purchase_id
      where p.user_id = auth.uid()
    )
  );

create policy "warranties_owner" on public.warranties
  for all using (
    item_id in (
      select pi.id from public.purchase_items pi
      join public.purchases p on p.id = pi.purchase_id
      where p.user_id = auth.uid()
    )
  ) with check (
    item_id in (
      select pi.id from public.purchase_items pi
      join public.purchases p on p.id = pi.purchase_id
      where p.user_id = auth.uid()
    )
  );

create policy "inventory_items_owner" on public.inventory_items
  for all using (
    item_id in (
      select pi.id from public.purchase_items pi
      join public.purchases p on p.id = pi.purchase_id
      where p.user_id = auth.uid()
    )
  ) with check (
    item_id in (
      select pi.id from public.purchase_items pi
      join public.purchases p on p.id = pi.purchase_id
      where p.user_id = auth.uid()
    )
  );

create policy "subscriptions_owner" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders_owner" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
