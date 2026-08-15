import Link from 'next/link';
import { requireUser } from '@/lib/supabase/current-user';
import { formatMoney } from '@/lib/money';
import type { Purchase } from '@/types/database';

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { supabase, user } = await requireUser();

  let purchases: Purchase[] = [];

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;

    const [{ data: byPurchase }, { data: itemMatches }] = await Promise.all([
      supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .or(`retailer.ilike.${term},order_number.ilike.${term},notes.ilike.${term}`),
      supabase
        .from('purchase_items')
        .select('purchase_id, purchases(*)')
        .or(`name.ilike.${term},category.ilike.${term},brand.ilike.${term},model.ilike.${term},serial_number.ilike.${term}`),
    ]);

    const byId = new Map<string, Purchase>();
    for (const p of byPurchase ?? []) byId.set(p.id, p);
    for (const row of itemMatches ?? []) {
      const p = row.purchases as unknown as Purchase | null;
      if (p && p.user_id === user.id) byId.set(p.id, p);
    }
    purchases = Array.from(byId.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else {
    const { data } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    purchases = data ?? [];
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-lg font-semibold text-zinc-900">Vault</h1>

      <form className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by item, retailer, brand, tag…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </form>

      <div className="mt-4 space-y-2">
        {purchases.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {q ? 'No matches.' : 'No purchases yet — add your first receipt.'}
          </p>
        ) : (
          purchases.map((p) => (
            <Link
              key={p.id}
              href={`/purchases/${p.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm"
            >
              <div>
                <p className="text-zinc-900">{p.retailer ?? 'Purchase'}</p>
                <p className="text-xs text-zinc-500">{p.purchase_date ?? '—'}</p>
              </div>
              <span className="text-zinc-500">{formatMoney(p.total_cents, p.currency)}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
