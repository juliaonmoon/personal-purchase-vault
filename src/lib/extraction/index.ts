import { AnthropicExtractionProvider } from './anthropic-provider';
import type { ExtractionProvider } from './types';

// Single swap point: change this line to switch AI/OCR providers.
export const extractionProvider: ExtractionProvider = new AnthropicExtractionProvider();

export type { ExtractionInput, ExtractionOutcome, ExtractionProvider } from './types';
