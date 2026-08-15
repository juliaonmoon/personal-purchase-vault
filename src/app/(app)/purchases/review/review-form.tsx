'use client';

import { useState } from 'react';
import { createPurchase } from '../actions';
import { centsToDollarsInput } from '@/lib/money';
import type { ExtractedPurchaseData } from '@/types/database';

interface ItemDraft {
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

function toItemDraft(item: ExtractedPurchaseData['items'][number]): ItemDraft {
  return {
    name: item.name,
    quantity: item.quantity || 1,
    unitPrice: centsToDollarsInput(item.unit_price_cents),
    category: item.category ?? '',
    brand: item.brand ?? '',
    model: item.model ?? '',
    serialNumber: '',
    returnDeadline: '',
    warrantyEnd: '',
    addToInventory: false,
    locationTag: '',
  };
}

export function ReviewForm({
  documentId,
  extracted,
  defaultCurrency,
}: {
  documentId: string;
  extracted: ExtractedPurchaseData;
  defaultCurrency: string;
}) {
  const [items, setItems] = useState<ItemDraft[]>(
    extracted.items.length > 0 ? extracted.items.map(toItemDraft) : [toItemDraft({ name: '', quantity: 1, unit_price_cents: null, category: null, brand: null, model: null })]
  );
  const [isSaving, setIsSaving] = useState(false);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      toItemDraft({ name: '', quantity: 1, unit_price_cents: null, category: null, brand: null, model: null }),
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form
      action={createPurchase}
      onSubmit={() => setIsSaving(true)}
      className="mt-6 space-y-8"
    >
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="itemCount" value={items.length} />

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-zinc-900">Purchase details</legend>

        <div>
          <label className="block text-sm text-zinc-700">Retailer</label>
          <input
            name="retailer"
            defaultValue={extracted.retailer ?? ''}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-zinc-700">Purchase date</label>
            <input
              type="date"
              name="purchaseDate"
              defaultValue={extracted.purchase_date ?? ''}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-700">Currency</label>
            <input
              name="currency"
              defaultValue={extracted.currency ?? defaultCurrency}
              maxLength={3}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-zinc-700">Subtotal</label>
            <input
              name="subtotal"
              defaultValue={centsToDollarsInput(extracted.subtotal_cents)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-700">Tax</label>
            <input
              name="tax"
              defaultValue={centsToDollarsInput(extracted.tax_cents)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-700">Total</label>
            <input
              name="total"
              defaultValue={centsToDollarsInput(extracted.total_cents)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-700">Order / receipt number</label>
          <input
            name="orderNumber"
            defaultValue={extracted.order_number ?? ''}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="text-sm font-medium text-zinc-900">Items</legend>

        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Item {index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-600 underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm text-zinc-700">Name</label>
              <input
                name={`items[${index}][name]`}
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-zinc-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  name={`items[${index}][quantity]`}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-700">Unit price</label>
                <input
                  name={`items[${index}][unitPrice]`}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-zinc-700">Category</label>
                <input
                  name={`items[${index}][category]`}
                  value={item.category}
                  onChange={(e) => updateItem(index, { category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-700">Brand</label>
                <input
                  name={`items[${index}][brand]`}
                  value={item.brand}
                  onChange={(e) => updateItem(index, { brand: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-700">Model</label>
                <input
                  name={`items[${index}][model]`}
                  value={item.model}
                  onChange={(e) => updateItem(index, { model: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-700">Serial number</label>
              <input
                name={`items[${index}][serialNumber]`}
                value={item.serialNumber}
                onChange={(e) => updateItem(index, { serialNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3">
              <div>
                <label className="block text-sm text-zinc-700">Return deadline</label>
                <input
                  type="date"
                  name={`items[${index}][returnDeadline]`}
                  value={item.returnDeadline}
                  onChange={(e) => updateItem(index, { returnDeadline: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-700">Warranty ends</label>
                <input
                  type="date"
                  name={`items[${index}][warrantyEnd]`}
                  value={item.warrantyEnd}
                  onChange={(e) => updateItem(index, { warrantyEnd: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name={`items[${index}][addToInventory]`}
                checked={item.addToInventory}
                onChange={(e) => updateItem(index, { addToInventory: e.target.checked })}
              />
              Add to home inventory
            </label>

            {item.addToInventory && (
              <div>
                <label className="block text-sm text-zinc-700">Room / person tag</label>
                <input
                  name={`items[${index}][locationTag]`}
                  value={item.locationTag}
                  onChange={(e) => updateItem(index, { locationTag: e.target.value })}
                  placeholder="e.g. Kitchen, Sara, Office"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:border-zinc-400"
        >
          + Add another item
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save purchase'}
      </button>
    </form>
  );
}
