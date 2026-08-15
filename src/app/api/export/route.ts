import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile, purchases, items, returns, warranties, inventory, subscriptions] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('purchases').select('*').eq('user_id', user.id),
    supabase.from('purchase_items').select('*, purchases!inner(user_id)').eq('purchases.user_id', user.id),
    supabase.from('returns').select('*, purchase_items!inner(purchase_id, purchases!inner(user_id))').eq('purchase_items.purchases.user_id', user.id),
    supabase.from('warranties').select('*, purchase_items!inner(purchase_id, purchases!inner(user_id))').eq('purchase_items.purchases.user_id', user.id),
    supabase.from('inventory_items').select('*, purchase_items!inner(purchase_id, purchases!inner(user_id))').eq('purchase_items.purchases.user_id', user.id),
    supabase.from('subscriptions').select('*').eq('user_id', user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    purchases: purchases.data,
    purchase_items: items.data,
    returns: returns.data,
    warranties: warranties.data,
    inventory_items: inventory.data,
    subscriptions: subscriptions.data,
    note: 'Original receipt/document files are not included in this export. Delete your account to remove them, or contact support to request the files directly.',
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="personal-purchase-vault-export.json"',
    },
  });
}
