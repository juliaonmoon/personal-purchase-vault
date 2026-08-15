import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/current-user';
import { formatMoney } from '@/lib/money';
import { getSignedDocumentUrl } from '@/lib/storage';
import { markReturned, markWarrantyClaimed, deletePurchase } from '../actions';

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: purchase } = await supabase.from('purchases').select('*').eq('id', id).single();
  if (!purchase) notFound();

  const { data: items } = await supabase
    .from('purchase_items')
    .select('*, returns(*), warranties(*), inventory_items(*)')
    .eq('purchase_id', id);

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('purchase_id', id);

  const documentLinks = await Promise.all(
    (documents ?? []).map(async (doc) => ({
      ...doc,
      signedUrl: await getSignedDocumentUrl(supabase, doc.storage_key).catch(() => null),
    }))
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/vault" className="text-sm text-zinc-500 underline">
        ← Back to vault
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{purchase.retailer ?? 'Purchase'}</h1>
          <p className="text-sm text-zinc-500">
            {purchase.purchase_date ?? 'Unknown date'}
            {purchase.order_number ? ` · #${purchase.order_number}` : ''}
          </p>
        </div>
        <span className="text-sm font-medium text-zinc-900">
          {formatMoney(purchase.total_cents, purchase.currency)}
        </span>
      </div>

      {documentLinks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {documentLinks.map((doc) =>
            doc.signedUrl ? (
              <a
                key={doc.id}
                href={doc.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
              >
                View original {doc.doc_type.replace('_', ' ')}
              </a>
            ) : null
          )}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {(items ?? []).map((item) => {
          const returnRecord = Array.isArray(item.returns) ? item.returns[0] : item.returns;
          const warranty = Array.isArray(item.warranties) ? item.warranties[0] : item.warranties;
          const inventory = Array.isArray(item.inventory_items) ? item.inventory_items[0] : item.inventory_items;

          return (
            <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-500">
                    {[item.brand, item.model].filter(Boolean).join(' · ') || item.category || '—'}
                  </p>
                </div>
                <span className="text-sm text-zinc-700">
                  {item.quantity > 1 ? `${item.quantity} × ` : ''}
                  {formatMoney(item.unit_price_cents, purchase.currency)}
                </span>
              </div>

              {returnRecord && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs">
                  <span className="text-amber-800">
                    Return by {returnRecord.deadline_date} · {returnRecord.status}
                  </span>
                  {returnRecord.status === 'open' && (
                    <form action={markReturned}>
                      <input type="hidden" name="returnId" value={returnRecord.id} />
                      <input type="hidden" name="purchaseId" value={purchase.id} />
                      <button type="submit" className="font-medium text-amber-900 underline">
                        Mark returned
                      </button>
                    </form>
                  )}
                </div>
              )}

              {warranty && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs">
                  <span className="text-blue-800">
                    Warranty ends {warranty.end_date} · {warranty.status}
                  </span>
                  {warranty.status === 'active' && (
                    <form action={markWarrantyClaimed}>
                      <input type="hidden" name="warrantyId" value={warranty.id} />
                      <input type="hidden" name="purchaseId" value={purchase.id} />
                      <button type="submit" className="font-medium text-blue-900 underline">
                        Mark claimed
                      </button>
                    </form>
                  )}
                </div>
              )}

              {inventory && (
                <p className="mt-2 text-xs text-zinc-400">
                  In inventory{inventory.location_tag ? ` · ${inventory.location_tag}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {purchase.notes && <p className="mt-4 text-sm text-zinc-500">{purchase.notes}</p>}

      <form action={deletePurchase} className="mt-8">
        <input type="hidden" name="purchaseId" value={purchase.id} />
        <button type="submit" className="text-xs text-red-600 underline">
          Delete this purchase
        </button>
      </form>
    </div>
  );
}
