import Link from 'next/link';
import { requireUser } from '@/lib/supabase/current-user';
import { formatMoney } from '@/lib/money';

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: openReturns }, { data: activeWarranties }, { data: recentPurchases }] = await Promise.all([
    supabase
      .from('returns')
      .select('*, purchase_items(name, purchase_id, purchases(retailer))')
      .eq('status', 'open')
      .order('deadline_date', { ascending: true })
      .limit(5),
    supabase
      .from('warranties')
      .select('*, purchase_items(name, purchase_id, purchases(retailer))')
      .eq('status', 'active')
      .order('end_date', { ascending: true })
      .limit(5),
    supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const upcomingReturns = (openReturns ?? []).filter((r) => r.deadline_date >= today);
  const upcomingWarranties = (activeWarranties ?? []).filter((w) => w.end_date >= today);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Your vault</h1>
        <Link
          href="/upload"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          + Add purchase
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500">Needs your attention</h2>
        {upcomingReturns.length === 0 && upcomingWarranties.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">Nothing due soon.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {upcomingReturns.map((r) => (
              <Link
                key={r.id}
                href={`/purchases/${r.purchase_items?.purchase_id}`}
                className="block rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                Return {r.purchase_items?.name} by {r.deadline_date}
                {r.purchase_items?.purchases?.retailer ? ` · ${r.purchase_items.purchases.retailer}` : ''}
              </Link>
            ))}
            {upcomingWarranties.map((w) => (
              <Link
                key={w.id}
                href={`/purchases/${w.purchase_items?.purchase_id}`}
                className="block rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900"
              >
                Warranty on {w.purchase_items?.name} ends {w.end_date}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">Recent purchases</h2>
          <Link href="/vault" className="text-xs text-zinc-500 underline">
            View all
          </Link>
        </div>
        {(!recentPurchases || recentPurchases.length === 0) ? (
          <p className="mt-2 text-sm text-zinc-400">No purchases yet — add your first receipt.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {recentPurchases.map((p) => (
              <Link
                key={p.id}
                href={`/purchases/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <span className="text-zinc-900">{p.retailer ?? 'Purchase'}</span>
                <span className="text-zinc-500">{formatMoney(p.total_cents, p.currency)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
