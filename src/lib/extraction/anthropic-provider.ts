import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedPurchaseData } from '@/types/database';
import type { ExtractionInput, ExtractionOutcome, ExtractionProvider } from './types';

const MODEL = process.env.ANTHROPIC_EXTRACTION_MODEL ?? 'claude-sonnet-5';

const SYSTEM_PROMPT = `You extract structured purchase data from a receipt, invoice, order confirmation, or warranty document image/PDF.
Respond with ONLY a JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "retailer": string | null,
  "purchase_date": string | null,  // ISO 8601 date, e.g. "2026-08-12"
  "subtotal_cents": number | null,
  "tax_cents": number | null,
  "total_cents": number | null,
  "currency": string | null,       // ISO 4217, e.g. "CAD", "USD"
  "order_number": string | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unit_price_cents": number | null,
      "category": string | null,
      "brand": string | null,
      "model": string | null
    }
  ]
}
All monetary values are integer cents (multiply dollars by 100). If a field is not visible or not present, use null.
Never invent values you cannot see in the document. If no line items are visible, return an empty items array.`;

function buildContentBlock(input: ExtractionInput): Anthropic.Messages.ContentBlockParam {
  const data = input.fileBytes.toString('base64');

  if (input.mimeType === 'application/pdf') {
    return {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data },
    };
  }

  return {
    type: 'image',
    source: { type: 'base64', media_type: input.mimeType as 'image/jpeg', data },
  };
}

function parseStructuredOutput(text: string): ExtractedPurchaseData {
  const parsed = JSON.parse(text);
  return {
    retailer: parsed.retailer ?? null,
    purchase_date: parsed.purchase_date ?? null,
    subtotal_cents: parsed.subtotal_cents ?? null,
    tax_cents: parsed.tax_cents ?? null,
    total_cents: parsed.total_cents ?? null,
    currency: parsed.currency ?? null,
    order_number: parsed.order_number ?? null,
    items: Array.isArray(parsed.items)
      ? parsed.items.map((item: Record<string, unknown>) => ({
          name: String(item.name ?? 'Item'),
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          unit_price_cents: typeof item.unit_price_cents === 'number' ? item.unit_price_cents : null,
          category: (item.category as string) ?? null,
          brand: (item.brand as string) ?? null,
          model: (item.model as string) ?? null,
        }))
      : [],
  };
}

export class AnthropicExtractionProvider implements ExtractionProvider {
  readonly name = 'anthropic-claude-vision';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }

  async extract(input: ExtractionInput): Promise<ExtractionOutcome> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              buildContentBlock(input),
              { type: 'text', text: 'Extract the purchase data as JSON per the schema in your instructions.' },
            ],
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in extraction response');
      }

      const structuredOutput = parseStructuredOutput(textBlock.text);

      return {
        provider: this.name,
        status: 'succeeded',
        structuredOutput,
        rawResponse: response,
        confidence: null,
        errorMessage: null,
      };
    } catch (error) {
      return {
        provider: this.name,
        status: 'failed',
        structuredOutput: null,
        rawResponse: null,
        confidence: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown extraction error',
      };
    }
  }
}
