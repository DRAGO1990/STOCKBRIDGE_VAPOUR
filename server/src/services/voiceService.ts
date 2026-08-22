import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

// Valid categories must match client-side CATEGORIES
const VALID_CATEGORIES = [
  'Groceries',
  'Stationery',
  'Electronics',
  'Packaging',
  'Textiles',
  'Hardware',
  'Dairy & Beverages',
  'Prepared Food & Bakery',
];

const VALID_UNITS = ['kg', 'pieces', 'packets', 'bags', 'cans', 'litres', 'boxes', 'reams', 'cartons'];

// Language-code to human name map for prompt context
const LANGUAGE_NAMES: Record<string, string> = {
  'hi-IN': 'Hindi',
  'en-IN': 'English',
  'bn-IN': 'Bengali',
  'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
};

export interface VoiceExtraction {
  title: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  expiryDate: string | null;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
  confidence: number;
  missingFields: string[];
}

function buildExtractionPrompt(transcript: string, language: string): string {
  const langName = LANGUAGE_NAMES[language] || 'English';
  return `You are a structured data extraction assistant for an Indian B2B surplus inventory marketplace called StockBridge.

A shopkeeper spoke the following in ${langName}. Extract listing details from their speech.

TRANSCRIPT:
"${transcript}"

RULES:
1. Extract: title, category, quantity, unit, pricePerUnit, expiryDate, urgency, notes.
2. category MUST be one of: ${VALID_CATEGORIES.map((c) => `"${c}"`).join(', ')}. Pick the closest match.
3. unit MUST be one of: ${VALID_UNITS.map((u) => `"${u}"`).join(', ')}. Pick the closest match.
4. urgency must be "low", "medium", or "high". Default "low" if not mentioned.
5. expiryDate must be in ISO format YYYY-MM-DD if mentioned (interpret relative dates like "next month" relative to today: ${new Date().toISOString().split('T')[0]}). Set null if not mentioned.
6. pricePerUnit should be per single unit in Indian Rupees (₹). If total price is mentioned, divide by quantity.
7. title should be a clean, concise product description in English (translate if needed).
8. notes: any extra info the seller mentioned that doesn't fit other fields.
9. confidence: 0.0 to 1.0 — how confident you are in the extraction.
10. missingFields: list field names that were NOT mentioned and you had to guess or leave empty.

Respond ONLY with valid JSON. No markdown, no explanation. Example:
{
  "title": "Basmati Rice 25kg bags",
  "category": "Groceries",
  "quantity": 50,
  "unit": "bags",
  "pricePerUnit": 120,
  "expiryDate": "2025-03-15",
  "urgency": "medium",
  "notes": "Slightly damaged packaging",
  "confidence": 0.85,
  "missingFields": []
}`;
}

function sanitizeExtraction(raw: any): VoiceExtraction {
  // Normalize category
  let category = String(raw.category || 'Groceries');
  if (!VALID_CATEGORIES.includes(category)) {
    const lower = category.toLowerCase();
    const match = VALID_CATEGORIES.find((c) => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()));
    category = match || 'Groceries';
  }

  // Normalize unit
  let unit = String(raw.unit || 'pieces').toLowerCase();
  if (!VALID_UNITS.includes(unit)) {
    const match = VALID_UNITS.find((u) => u.includes(unit) || unit.includes(u));
    unit = match || 'pieces';
  }

  // Normalize urgency
  let urgency: 'low' | 'medium' | 'high' = 'low';
  if (['low', 'medium', 'high'].includes(String(raw.urgency || '').toLowerCase())) {
    urgency = raw.urgency.toLowerCase() as 'low' | 'medium' | 'high';
  }

  // Normalize expiry date
  let expiryDate: string | null = null;
  if (raw.expiryDate) {
    const parsed = new Date(raw.expiryDate);
    if (!isNaN(parsed.getTime())) {
      expiryDate = parsed.toISOString().split('T')[0];
    }
  }

  return {
    title: String(raw.title || '').trim(),
    category,
    quantity: Math.max(0, Number(raw.quantity) || 0),
    unit,
    pricePerUnit: Math.max(0, Number(raw.pricePerUnit) || 0),
    expiryDate,
    urgency,
    notes: String(raw.notes || '').trim(),
    confidence: Math.min(1, Math.max(0, Number(raw.confidence) || 0.5)),
    missingFields: Array.isArray(raw.missingFields) ? raw.missingFields.map(String) : [],
  };
}

export async function extractListingFromSpeech(
  transcript: string,
  language: string
): Promise<VoiceExtraction> {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 1024,
    },
  });

  const prompt = buildExtractionPrompt(transcript, language);

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text().trim();

      // Strip markdown code fences if present
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
      }

      const parsed = JSON.parse(text);
      return sanitizeExtraction(parsed);
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        console.error('Voice extraction failed after retries:', err.message);
        throw new Error(`AI extraction failed: ${err.message}`);
      }
      // Brief delay before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Fallback (shouldn't reach here)
  throw new Error('AI extraction failed after all retry attempts');
}
