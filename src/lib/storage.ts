import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'documents';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export function buildStorageKey(userId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${crypto.randomUUID()}-${safeName}`;
}

export async function uploadDocument(
  supabase: SupabaseClient,
  storageKey: string,
  file: Buffer,
  mimeType: string
) {
  const { error } = await supabase.storage.from(BUCKET).upload(storageKey, file, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;
}

export async function getSignedDocumentUrl(
  supabase: SupabaseClient,
  storageKey: string,
  expiresInSeconds = 300
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storageKey, expiresInSeconds);
  if (error || !data) throw error ?? new Error('Failed to create signed URL');
  return data.signedUrl;
}

export async function deleteDocument(supabase: SupabaseClient, storageKey: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey]);
  if (error) throw error;
}
