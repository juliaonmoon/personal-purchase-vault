'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/current-user';
import { dollarsInputToCents } from '@/lib/money';
import { buildReturnReminders, buildWarrantyReminders } from '@/lib/reminders';

interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  returnDeadline: string;
  warrantyEnd: string;
  addToInventory: boolean;
  locationTag: string;
}

function parseItems(formData: FormData): ParsedItem[] {
  const count = Number(formData.get('itemCount') ?? 0);
  const items: ParsedItem[] = [];

  for (let i = 0; i < count; i++) {
    const name = String(formData.get(`items[${i}][name]`) ?? '').trim();
    if (!name) continue;

    items.push({
      name,
      quantity: Number(formData.get(`items[${i}][quantity]`)) || 1,
      unitPrice: String(formData.get(`items[${i}][unitPrice]`) ?? ''),
      category: String(formData.get(`items[${i}][category]`) ?? '').trim(),
      brand: String(formData.get(`items[${i}][brand]`) ?? '').trim(),
      model: String(formData.get(`items[${i}][model]`) ?? '').trim(),
      serialNumber: String(formData.get(`items[${i}][serialNumber]`) ?? '').trim(),
      returnDeadline: String(formData.get(`items[${i}][returnDeadline]`) ?? '').trim(),
      warrantyEnd: String(formData.get(`items[${i}][warrantyEnd]`) ?? '').trim(),
      addToInventory: formData.get(`items[${i}][addToInventory]`) === 'on',
      locationTag: String(formData.get(`items[${i}][locationTag]`) ?? '').trim(),
    });
  }

  return items;
}

export async function createPurchase(formData: FormData) {
  const { supabase, user, profile } = await requireUser();
  const timezone = profile?.timezone ?? 'America/Vancouver';

  const documentId = String(formData.get('documentId') ?? '');
  const items = parseItems(formData);

  if (items.length === 0) {
    redirect(`/purchases/review?document=${documentId}&error=${encodeURIComponent('Add at least one item.')}`);
  }

  // Idempotency: a duplicate submit for the same document reuses the existing
  // purchase instead of creating a second one (ADR-007).
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('upload_idempotency_key', documentId)
    .maybeSingle();

  if (existingPurchase) {
    redirect(`/purchases/${existingPurchase.id}`);
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      user_id: user.id,
      retailer: String(formData.get('retailer') ?? '').trim() || null,
      purchase_date: String(formData.get('purchaseDate') ?? '').trim() || null,
      subtotal_cents: dollarsInputToCents(String(formData.get('subtotal') ?? '')),
      tax_cents: dollarsInputToCents(String(formData.get('tax') ?? '')),
      total_cents: dollarsInputToCents(String(formData.get('total') ?? '')),
      currency: (String(formData.get('currency') ?? '') || profile?.default_currency || 'CAD').toUpperCase().slice(0, 3),
      order_number: String(formData.get('orderNumber') ?? '').trim() || null,
      source: 'upload',
      upload_idempotency_key: documentId || null,
    })
    .select()
    .single();

  if (purchaseError || !purchase) {
    redirect(`/purchases/review?document=${documentId}&error=${encodeURIComponent('Could not save the purchase. Try again.')}`);
  }

  if (documentId) {
    await supabase.from('documents').update({ purchase_id: purchase.id }).eq('id', documentId);
  }

  for (const item of items) {
    const { data: purchaseItem, error: itemError } = await supabase
      .from('purchase_items')
      .insert({
        purchase_id: purchase.id,
        name: item.name,
        quantity: item.quantity,
        unit_price_cents: dollarsInputToCents(item.unitPrice),
        category: item.category || null,
        brand: item.brand || null,
        model: item.model || null,
        serial_number: item.serialNumber || null,
      })
      .select()
      .single();

    if (itemError || !purchaseItem) continue;

    if (item.returnDeadline) {
      const { data: returnRecord } = await supabase
        .from('returns')
        .insert({ item_id: purchaseItem.id, deadline_date: item.returnDeadline, status: 'open' })
        .select()
        .single();

      if (returnRecord) {
        const reminders = buildReturnReminders({
          userId: user.id,
          returnId: returnRecord.id,
          deadlineDateISO: item.returnDeadline,
          timezone,
        });
        if (reminders.length > 0) await supabase.from('reminders').insert(reminders);
      }
    }

    if (item.warrantyEnd) {
      const { data: warranty } = await supabase
        .from('warranties')
        .insert({ item_id: purchaseItem.id, end_date: item.warrantyEnd, status: 'active' })
        .select()
        .single();

      if (warranty) {
        const reminders = buildWarrantyReminders({
          userId: user.id,
          warrantyId: warranty.id,
          endDateISO: item.warrantyEnd,
          timezone,
        });
        if (reminders.length > 0) await supabase.from('reminders').insert(reminders);
      }
    }

    if (item.addToInventory) {
      await supabase.from('inventory_items').insert({
        item_id: purchaseItem.id,
        location_tag: item.locationTag || null,
        ownership_status: 'owned',
      });
    }
  }

  redirect(`/purchases/${purchase.id}`);
}

export async function markReturned(formData: FormData) {
  const { supabase } = await requireUser();
  const returnId = String(formData.get('returnId') ?? '');
  const purchaseId = String(formData.get('purchaseId') ?? '');

  await supabase
    .from('returns')
    .update({ status: 'returned', returned_date: new Date().toISOString().slice(0, 10) })
    .eq('id', returnId);

  await supabase.from('reminders').update({ status: 'cancelled' }).eq('return_id', returnId).eq('status', 'pending');

  redirect(`/purchases/${purchaseId}`);
}

export async function markWarrantyClaimed(formData: FormData) {
  const { supabase } = await requireUser();
  const warrantyId = String(formData.get('warrantyId') ?? '');
  const purchaseId = String(formData.get('purchaseId') ?? '');

  await supabase.from('warranties').update({ status: 'claimed' }).eq('id', warrantyId);
  await supabase.from('reminders').update({ status: 'cancelled' }).eq('warranty_id', warrantyId).eq('status', 'pending');

  redirect(`/purchases/${purchaseId}`);
}

export async function deletePurchase(formData: FormData) {
  const { supabase, user } = await requireUser();
  const purchaseId = String(formData.get('purchaseId') ?? '');

  const { data: documents } = await supabase
    .from('documents')
    .select('storage_key')
    .eq('purchase_id', purchaseId)
    .eq('user_id', user.id);

  if (documents && documents.length > 0) {
    const { deleteDocument } = await import('@/lib/storage');
    await Promise.all(documents.map((doc) => deleteDocument(supabase, doc.storage_key)));
  }

  // purchase_items/returns/warranties/inventory_items/reminders cascade from
  // this delete via FK constraints. documents.purchase_id is ON DELETE SET
  // NULL (a document can outlive the purchase it was extracted from), so its
  // rows are removed explicitly here instead.
  await supabase.from('documents').delete().eq('purchase_id', purchaseId).eq('user_id', user.id);
  await supabase.from('purchases').delete().eq('id', purchaseId).eq('user_id', user.id);

  redirect('/vault');
}
