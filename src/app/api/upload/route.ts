import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractionProvider } from '@/lib/extraction';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  buildStorageKey,
  uploadDocument,
} from '@/lib/storage';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Use JPG, PNG, HEIC, or PDF.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File is too large (max 15MB).' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = buildStorageKey(user.id, file.name);

  await uploadDocument(supabase, storageKey, bytes, file.type);

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      doc_type: 'receipt',
      storage_key: storageKey,
      file_name: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
    })
    .select()
    .single();

  if (documentError || !document) {
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
  }

  const outcome = await extractionProvider.extract({ fileBytes: bytes, mimeType: file.type });

  const { data: extractionResult } = await supabase
    .from('extraction_results')
    .insert({
      document_id: document.id,
      provider: outcome.provider,
      status: outcome.status,
      structured_output: outcome.structuredOutput,
      raw_response: outcome.rawResponse,
      confidence: outcome.confidence,
      error_message: outcome.errorMessage,
    })
    .select()
    .single();

  return NextResponse.json({
    documentId: document.id,
    extractionStatus: outcome.status,
    extraction: outcome.structuredOutput,
    extractionResultId: extractionResult?.id ?? null,
    errorMessage: outcome.errorMessage,
  });
}
