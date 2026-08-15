import Link from 'next/link';
import { requireUser } from '@/lib/supabase/current-user';
import { formatMoney } from '@/lib/money';

export default async function InventoryPage() {
  const { supabase } = await requireUser();

  const { data: inventory } = await supabase
    .from('inventory_items')
    .select('*, purchase_items(*, purchases(currency), warranties(*))')
    .eq('ownership_status', 'owned')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-lg font-semibold text-zinc-900">Home inventory</h1>

      {(!inventory || inventory.length === 0) ? (
        <p className="mt-4 text-sm text-zinc-400">
          Durable items you add to inventory when reviewing a purchase will show up here.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {inventory.map((inv) => {
            const item = inv.purchase_items;
            const warranty = Array.isArray(item?.warranties) ? item?.warranties[0] : item?.warranties;
            return (
              <Link
                key={inv.id}
                href={`/purchases/${item?.purchase_id}`}
                className="rounded-xl border border-zinc-200 bg-white p-3"
              >
                <p className="text-sm font-medium text-zinc-900">{item?.name}</p>
                <p className="text-xs text-zinc-500">{inv.location_tag ?? 'Unassigned'}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {formatMoney(item?.unit_price_cents ?? null, item?.purchases?.currency ?? 'CAD')}
                </p>
                {warranty && warranty.status === 'active' && (
                  <p className="mt-1 text-xs text-blue-700">Warranty to {warranty.end_date}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
