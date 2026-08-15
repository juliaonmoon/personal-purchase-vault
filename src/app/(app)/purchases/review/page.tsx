import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/current-user';
import type { ExtractedPurchaseData } from '@/types/database';
import { ReviewForm } from './review-form';

export default async function ReviewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ document?: string }>;
}) {
  const { document: documentId } = await searchParams;
  if (!documentId) notFound();

  const { supabase, profile } = await requireUser();

  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (!document) notFound();

  const { data: extractionResult } = await supabase
    .from('extraction_results')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const extracted: ExtractedPurchaseData = extractionResult?.structured_output ?? {
    retailer: null,
    purchase_date: null,
    subtotal_cents: null,
    tax_cents: null,
    total_cents: null,
    currency: profile?.default_currency ?? 'CAD',
    order_number: null,
    items: [{ name: '', quantity: 1, unit_price_cents: null, category: null, brand: null, model: null }],
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-lg font-semibold text-zinc-900">Review purchase</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {extractionResult?.status === 'failed'
          ? "We couldn't read this document automatically — fill in the details below."
          : 'Fix anything the extraction got wrong before saving.'}
      </p>

      <ReviewForm
        documentId={documentId}
        extracted={extracted}
        defaultCurrency={profile?.default_currency ?? 'CAD'}
      />
    </div>
  );
}
