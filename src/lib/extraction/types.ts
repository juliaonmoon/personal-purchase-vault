import type { ExtractedPurchaseData } from '@/types/database';

export interface ExtractionInput {
  fileBytes: Buffer;
  mimeType: string;
}

export interface ExtractionOutcome {
  provider: string;
  status: 'succeeded' | 'failed';
  structuredOutput: ExtractedPurchaseData | null;
  rawResponse: unknown;
  confidence: number | null;
  errorMessage: string | null;
}

// Swap point: any provider (Anthropic, an OCR API, a future in-house model)
// implements this single method and can be dropped in without touching the
// upload route or the rest of the app.
export interface ExtractionProvider {
  readonly name: string;
  extract(input: ExtractionInput): Promise<ExtractionOutcome>;
}
