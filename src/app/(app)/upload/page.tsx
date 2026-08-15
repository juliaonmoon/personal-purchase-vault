'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? 'Upload failed');
      }

      router.push(`/purchases/review?document=${result.documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong uploading that file.');
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-lg font-semibold text-zinc-900">Add a purchase</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Take a photo or upload a receipt, invoice, order confirmation, or warranty document.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <label
        className={`mt-6 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isUploading
            ? 'cursor-not-allowed border-zinc-200 bg-zinc-100'
            : 'cursor-pointer border-zinc-300 bg-white hover:border-zinc-400'
        }`}
      >
        <span className="text-sm font-medium text-zinc-700">
          {isUploading ? 'Processing…' : 'Tap to take a photo or choose a file'}
        </span>
        <span className="text-xs text-zinc-400">JPG, PNG, HEIC, or PDF · up to 15MB</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/heic,application/pdf"
          capture="environment"
          disabled={isUploading}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
    </div>
  );
}
