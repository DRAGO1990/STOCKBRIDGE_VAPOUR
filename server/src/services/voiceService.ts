import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

// Valid categories must match client-side CATEGORIES
export const VALID_CATEGORIES = [
  'Groceries',
  'Stationery',
  'Electronics',
  'Packaging',
  'Textiles',
  'Hardware',
  'Dairy & Beverages',
  'Prepared Food & Bakery',
];

export const VALID_UNITS = ['kg', 'pieces', 'packets', 'bags', 'cans', 'litres', 'boxes', 'reams', 'cartons'];

// Language-code to human name map for prompt context
const LANGUAGE_NAMES: Record<string, string> = {
  'hi-IN': 'Hindi / Hinglish',
  'en-IN': 'Indian English',
  'kn-IN': 'Kannada',
  'pa-IN': 'Punjabi',
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

export function getIndianDateString(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

export function addCalendarDays(baseDateStr: string, days: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days, 12, 0, 0); // Noon prevents any daylight/DST/timezone rollover
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function calculateDaysRemaining(targetDateStr: string, baseDateStr?: string): number {
  const base = baseDateStr || getIndianDateString();
  const [y1, m1, d1] = base.split('-').map(Number);
  const [y2, m2, d2] = targetDateStr.split('-').map(Number);
  const d1Obj = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const d2Obj = new Date(y2, m2 - 1, d2, 12, 0, 0);
  return Math.round((d2Obj.getTime() - d1Obj.getTime()) / (1000 * 60 * 60 * 24));
}

function buildExtractionPrompt(transcript: string, language: string): string {
  const langName = LANGUAGE_NAMES[language] || 'Hindi / Hinglish / English';
  const todayStr = getIndianDateString();
  const defaultMinExpiryStr = addCalendarDays(todayStr, 30);

  return `You are an expert AI parser for StockBridge, an Indian B2B surplus inventory and dead stock liquidation marketplace.

A shopkeeper / distributor / merchant spoke the following voice description in ${langName}.
Analyze the transcript, interpret all Indian colloquial terms, measurements, numbers, and produce structured, professional listing data.

SPEECH TRANSCRIPT:
"${transcript}"

TODAY'S DATE: ${todayStr}

CRITICAL FIELD-FIRST EXTRACTION RULES:
1. "title":
   - NEVER include conversational starter phrases, seller statements, or filler clauses such as:
     "mere pass", "mere paas", "hamare paas", "humare paas", "apne paas", "i have", "we have",
     "jo me", "jo main", "bech sakta hu", "bechna chahte hai", "bechna hai", "sell karna hai",
     "aur meri", "air meri", "expiry date hai", "urgency level hai".
   - Extract the PRODUCT NOUN first (e.g. "Biscuit", "Fortune Sunflower Oil", "Basmati Rice", "Classmate Notebook").
   - Construct title using: PRODUCT + PACK CONTEXT + LOT SIZE.
   - Example 1: If speech says "mere pass 50 biscuit ke packet h jo me 10rs each me bech skta hu air meri expiry date h 20 din ki aur urgency level h medium", the title MUST BE: "Biscuit Packets (Lot of 50)". DO NOT write "mere pass 50 biscuit ke packet h".
   - Example 2: If speech says "Hamare paas Fortune sunflower oil 1 litre pouch ke 50 packets surplus bache hain", title should be: "Fortune Sunflower Oil 1L Pouch (Lot of 50)".
   - Example 3: If speech says "200 boxes of Classmate notebooks", title should be: "Classmate Notebooks (Lot of 200 Boxes)".

2. "category": Must be STRICTLY ONE of:
   - "Groceries" (Rice, Atta, Pulses, Sugar, Cooking Oil, Spices, Grains, Flour)
   - "Dairy & Beverages" (Milk, Butter, Cheese, Juice, Cold drinks, Tea, Coffee, Energy drinks)
   - "Prepared Food & Bakery" (Biscuits, Cookies, Chips, Namkeen, Bread, Cakes, Confectionery, Ready-to-eat)
   - "Packaging" (Cartons, Corrugated Boxes, Tape, Bubble Wrap, Pouches, Plastic Bags, Containers)
   - "Stationery" (Notebooks, A4 Paper, Pens, Files, Office stationery, Art supplies)
   - "Electronics" (Cables, Chargers, LED Bulbs, Accessories, Small appliances, Switches, Batteries)
   - "Textiles" (Fabrics, Shirts, Sarees, Garments, Towels, Bed linen, Yarn)
   - "Hardware" (Screws, Nails, Pipes, Tools, Paint, Fasteners, Electrical fittings)

3. "unit": Must be STRICTLY ONE of: ["kg", "pieces", "packets", "bags", "cans", "litres", "boxes", "reams", "cartons"].
   Map Indian regional terms accurately:
   - "katta", "bori", "thaili", "bora" -> "bags"
   - "peti", "dabba", "khokha", "carton" -> "boxes" or "cartons"
   - "packet", "pauchi", "pouch", "pudiya" -> "packets"
   - "darjan", "dozen" -> "pieces" (1 dozen = 12 pieces)
   - "nag", "piece", "pcs", "piece", "unit" -> "pieces"
   - "kilo", "kg", "kilogram" -> "kg"
   - "litre", "ltr", "l" -> "litres"
   - "tin", "can" -> "cans"
   - "gatta", "rim", "ream" -> "reams"

4. "quantity":
   - Extract the total number as an integer or float > 0.

5. "pricePerUnit":
   - Price in Indian Rupees (₹) per single unit.
   - If explicit per-unit price is stated (e.g. "10rs each", "10 rupaye each"), pricePerUnit = 10.
   - If total lot price is quoted, calculate total / quantity.

6. "expiryDate":
   - Must be ISO format YYYY-MM-DD.
   - IMPORTANT: StockBridge requires expiry dates to be AT LEAST 10 DAYS in the future from today (${todayStr}).
   - If relative days are explicitly spoken (e.g. "20 din" / "20 days"), calculate EXACTLY TODAY (${todayStr}) + 20 days.
   - If relative months are explicitly spoken (e.g. "2 mahine"), calculate TODAY + 60 days.
   - If no expiry date is stated or if it is a non-perishable product, set it to "${defaultMinExpiryStr}" and include "expiryDate" in "missingFields".

7. "urgency": Must be EXACTLY ONE of: "low", "medium", "high".
   - EXPLICIT USER-PROVIDED VALUES HAVE ABSOLUTE PRIORITY:
     * If user explicitly states "urgency level medium", "urgency medium", "medium urgency", or "urgency level h medium", urgency MUST be "medium".
     * If user explicitly states "urgency level high", "urgency high", "high urgency", "urgent", "turant", urgency MUST be "high".
     * If user explicitly states "urgency level low", "urgency low", "low urgency", "aram se", urgency MUST be "low".

8. "notes":
   - Clean summary of condition, packaging state, reasons for surplus, discounts, or special handling mentioned by the seller.

9. "confidence": Number between 0.0 and 1.0 based on how complete and clear the speech was.

10. "missingFields": Array of field names that were not explicitly mentioned in the speech.

OUTPUT JSON SCHEMA:
{
  "title": string,
  "category": string,
  "quantity": number,
  "unit": string,
  "pricePerUnit": number,
  "expiryDate": string,
  "urgency": "low" | "medium" | "high",
  "notes": string,
  "confidence": number,
  "missingFields": string[]
}
`;
}

export function resolveDeterministicTitle(
  rawTitle: string,
  category: string,
  quantity: number,
  unit: string,
  originalTranscript: string = ''
): string {
  const combined = `${rawTitle || ''} ${originalTranscript || ''}`.toLowerCase();

  // 1. Detect Brand
  let brand = '';
  if (/parle[- ]?g\b|parle\b/i.test(combined)) brand = 'Parle-G';
  else if (/britannia\s+good\s+day\b|good\s+day\b/i.test(combined)) brand = 'Britannia Good Day';
  else if (/britannia\s+marie\s+gold\b|marie\s+gold\b/i.test(combined)) brand = 'Britannia Marie Gold';
  else if (/britannia\b/i.test(combined)) brand = 'Britannia';
  else if (/oreo\b/i.test(combined)) brand = 'Oreo';
  else if (/dark\s+fantasy\b|sunfeast\b/i.test(combined)) brand = 'Sunfeast Dark Fantasy';
  else if (/bourbon\b/i.test(combined)) brand = 'Bourbon';
  else if (/monaco\b/i.test(combined)) brand = 'Monaco';
  else if (/patanjali\b/i.test(combined)) brand = 'Patanjali';
  else if (/classmate\b/i.test(combined)) brand = 'Classmate';
  else if (/fortune\b/i.test(combined)) brand = 'Fortune';
  else if (/haldiram|bikano|balaji/i.test(combined)) brand = 'Haldiram';

  const isBiscuitBrand = ['Parle-G', 'Britannia Good Day', 'Britannia Marie Gold', 'Britannia', 'Oreo', 'Sunfeast Dark Fantasy', 'Bourbon', 'Monaco'].includes(brand);

  // 2. Detect Product Noun
  let productNoun = '';
  if (
    /bisc?u[i]?ts?|bisk[u|i]?ts?|biscute|biskoot|cookie|cookies|rusk|namkeen|chips|bread|cake|bakery|बिस्किट|कुकीज|नमकीन/i.test(combined) ||
    isBiscuitBrand ||
    /biscuit|bakery|prepared food/i.test(category || '')
  ) {
    if (/cookie|cookies|कुकीज/i.test(combined)) productNoun = brand ? `${brand} Cookies` : 'Cookies';
    else if (/rusk|रस्क/i.test(combined)) productNoun = brand ? `${brand} Rusk` : 'Rusk';
    else if (/namkeen|नमकीन/i.test(combined)) productNoun = brand ? `${brand} Namkeen` : 'Namkeen';
    else if (/chips|चिप्स/i.test(combined)) productNoun = brand ? `${brand} Chips` : 'Chips';
    else if (/bread|ब्रेड/i.test(combined)) productNoun = brand ? `${brand} Bread` : 'Bread';
    else if (isBiscuitBrand || /bisc?u[i]?ts?|bisk[u|i]?ts?|biscute|biskoot|बिस्किट/i.test(combined)) {
      productNoun = brand ? `${brand} Biscuits` : 'Biscuit';
    } else if (brand) {
      productNoun = `${brand} Biscuits`;
    } else {
      productNoun = 'Biscuit';
    }
  } else if (/oil|tel|ghee|rice|chawal|basmati|atta|flour|wheat|gehu|dal|pulses|sugar|cheeni|masala|तेल|चावल|आटा|दाल|चीनी/i.test(combined)) {
    if (/fortune.*oil|sunflower.*oil/i.test(combined)) productNoun = 'Fortune Sunflower Oil';
    else if (/oil|tel|तेल/i.test(combined)) productNoun = 'Refined Cooking Oil';
    else if (/basmati|chawal|rice|चावल/i.test(combined)) productNoun = 'Basmati Rice';
    else if (/atta|flour|wheat|आटा|गेहूं/i.test(combined)) productNoun = 'Wheat Atta';
    else if (/dal|pulses|दाल/i.test(combined)) productNoun = 'Pulses / Dal';
    else if (/sugar|cheeni|चीनी/i.test(combined)) productNoun = 'Refined Sugar';
    else productNoun = 'Grocery Stock';
  } else if (/notebook|notebooks|copy|copies|register|pen|pens|paper|stationery|किताब|कॉपी|पेन|कागज/i.test(combined)) {
    if (/classmate/i.test(combined)) productNoun = 'Classmate Notebooks';
    else if (/notebook|notebooks|copy|कॉपी/i.test(combined)) productNoun = 'Student Notebooks';
    else if (/pen|pens|पेन/i.test(combined)) productNoun = 'Ballpoint Pens';
    else if (/paper|कागज/i.test(combined)) productNoun = 'A4 Paper Reams';
    else productNoun = 'Office Stationery';
  } else if (/milk|doodh|juice|tea|chai|coffee|beverage|दूध|जूस|चाय|कॉफी/i.test(combined)) {
    if (/milk|doodh|दूध/i.test(combined)) productNoun = 'Packaged Milk';
    else if (/juice|जूस/i.test(combined)) productNoun = 'Fruit Juice';
    else if (/tea|chai|चाय/i.test(combined)) productNoun = 'Premium Tea';
    else productNoun = 'Beverages';
  }

  const capUnit = unit ? unit.charAt(0).toUpperCase() + unit.slice(1) : 'Packets';

  // If a known product identity was found, ALWAYS construct the canonical product title!
  if (productNoun) {
    return `${productNoun} ${capUnit} (Lot of ${quantity || 1})`;
  }

  return 'Surplus Inventory Lot';
}

export const cleanProductTitle = resolveDeterministicTitle;

function sanitizeExtraction(raw: any, originalTranscript: string = ''): VoiceExtraction {
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

  // Quantity
  const quantity = Math.max(1, parseInt(String(raw.quantity), 10) || 1);

  // Price
  let pricePerUnit = parseFloat(String(raw.pricePerUnit)) || 0;
  const priceMatch = (originalTranscript || '').match(/(?:₹|rs\.?|rupaye|rupees)\s*(\d+(?:\.\d+)?)/i) ||
    (originalTranscript || '').match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees|₹|रुपये|रुपए)\s*(?:each|per|\/|में|me)?/i);
  if (priceMatch) {
    pricePerUnit = parseFloat(priceMatch[1]) || pricePerUnit;
  }

  // Deterministic Field-First Title
  const rawTitle = String(raw.title || '').trim();
  const title = resolveDeterministicTitle(rawTitle, category, quantity, unit, originalTranscript);

  // Normalize urgency with explicit priority
  let urgency: 'low' | 'medium' | 'high' = 'low';
  const lowerTranscript = (originalTranscript || '').toLowerCase();
  if (
    /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*medium\b/i.test(lowerTranscript) ||
    /\bmedium\s*(?:urgency|priority)\b/i.test(lowerTranscript) ||
    /(?:मीडियम\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*मीडियम|मध्यम|साधारण)/i.test(lowerTranscript)
  ) {
    urgency = 'medium';
  } else if (
    /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*high\b/i.test(lowerTranscript) ||
    /\bhigh\s*(?:urgency|priority)\b/i.test(lowerTranscript) ||
    /(?:हाई\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*हाई|अत्यंत\s*आवश्यक|तुरंत|जल्दी)/i.test(lowerTranscript)
  ) {
    urgency = 'high';
  } else if (raw.urgency === 'high' || raw.urgency === 'medium') {
    urgency = raw.urgency;
  }

  // Normalize expiry date with Indian calendar arithmetic (no UTC offset shifting!)
  const todayStr = getIndianDateString();
  let expiryDate: string = '';
  let hasExplicitExpiry = false;

  const daysMatch = lowerTranscript.match(/(\d+)\s*(?:din|days|दिन)/i);
  const weeksMatch = lowerTranscript.match(/(\d+)\s*(?:hafte|weeks|हफ्ते)/i);
  const monthsMatch = lowerTranscript.match(/(\d+)\s*(?:mahine|months|महीने)/i);

  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    expiryDate = addCalendarDays(todayStr, Math.max(10, days));
    hasExplicitExpiry = true;
  } else if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    expiryDate = addCalendarDays(todayStr, Math.max(10, weeks * 7));
    hasExplicitExpiry = true;
  } else if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    expiryDate = addCalendarDays(todayStr, months * 30);
    hasExplicitExpiry = true;
  } else if (raw.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(String(raw.expiryDate))) {
    const daysDiff = calculateDaysRemaining(String(raw.expiryDate), todayStr);
    if (daysDiff >= 10) {
      expiryDate = String(raw.expiryDate);
      hasExplicitExpiry = true;
    } else {
      expiryDate = addCalendarDays(todayStr, 10);
      hasExplicitExpiry = true;
    }
  }

  if (urgency === 'high' && !hasExplicitExpiry) {
    expiryDate = addCalendarDays(todayStr, 12);
  } else if (!expiryDate) {
    expiryDate = addCalendarDays(todayStr, 30);
  }

  const missingFields: string[] = Array.isArray(raw.missingFields) ? raw.missingFields.map(String) : [];
  if (!hasExplicitExpiry && !missingFields.includes('expiryDate')) {
    missingFields.push('expiryDate');
  }

  // Calculate dynamic confidence score based on actual field matches
  let calculatedConfidence = 0.50;
  if (rawTitle && rawTitle !== 'Surplus Inventory Lot') calculatedConfidence += 0.15;
  if (Number(raw.quantity) > 0) calculatedConfidence += 0.12;
  if (VALID_UNITS.includes(unit)) calculatedConfidence += 0.08;
  if (Number(raw.pricePerUnit) > 0) calculatedConfidence += 0.12;
  if (hasExplicitExpiry) calculatedConfidence += 0.08;
  if (urgency !== 'low' || String(raw.urgency).toLowerCase() === 'low') calculatedConfidence += 0.06;

  let finalConfidence = Number(raw.confidence);
  if (isNaN(finalConfidence) || finalConfidence <= 0) {
    finalConfidence = calculatedConfidence;
  }
  finalConfidence = Math.min(0.98, Math.max(0.40, Math.round(finalConfidence * 100) / 100));

  return {
    title: rawTitle,
    category,
    quantity: Math.max(0, Number(raw.quantity) || 0),
    unit,
    pricePerUnit: Math.max(0, Number(raw.pricePerUnit) || 0),
    expiryDate,
    urgency,
    notes: String(raw.notes || '').trim(),
    confidence: finalConfidence,
    missingFields,
  };
}

/**
 * Robust local fallback parser using field-first regular expressions and heuristics
 * when the AI API is unreachable, timed out, or unconfigured.
 */
export function fallbackRuleBasedExtractor(transcript: string): VoiceExtraction {
  const lower = transcript.toLowerCase();
  const missingFields: string[] = [];

  // 1. Extract quantity
  let quantity = 0;
  const qtyMatch =
    lower.match(/(\d+)\s*(?:kg|kilo|bag|bori|katta|packet|pauchi|pouch|piece|pcs|box|peti|can|litre|ltr|ream|carton|packets|boxes|bags|cans|litres|pieces|cartons|reams|पैकेट|कट्टे|बोरी|पेटी|डिब्बा|पीस|यूनिट|लीटर|किलो)/i) ||
    lower.match(/(\d+)/);

  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10) || 0;
  } else {
    if (lower.includes('pachaas') || lower.includes('fifty') || lower.includes('पचास')) quantity = 50;
    else if (lower.includes('sau') || lower.includes('hundred') || lower.includes('सौ')) quantity = 100;
    else if (lower.includes('bees') || lower.includes('twenty') || lower.includes('बीस')) quantity = 20;
    else if (lower.includes('das') || lower.includes('ten') || lower.includes('दस')) quantity = 10;
    else if (lower.includes('pachees') || lower.includes('twenty five') || lower.includes('पच्चीस')) quantity = 25;
    else missingFields.push('quantity');
  }

  // 2. Extract unit
  let unit = 'packets';
  if (lower.includes('kg') || lower.includes('kilo') || lower.includes('किलो')) unit = 'kg';
  else if (lower.includes('bori') || lower.includes('katta') || lower.includes('bag') || lower.includes('बोरी') || lower.includes('कट्टा')) unit = 'bags';
  else if (lower.includes('peti') || lower.includes('dabba') || lower.includes('box') || lower.includes('पेटी') || lower.includes('डिब्बा')) unit = 'boxes';
  else if (lower.includes('carton') || lower.includes('khokha') || lower.includes('कार्टन')) unit = 'cartons';
  else if (lower.includes('packet') || lower.includes('pauchi') || lower.includes('pouch') || lower.includes('पैकेट') || lower.includes('पाउच')) unit = 'packets';
  else if (lower.includes('piece') || lower.includes('pcs') || lower.includes('darjan') || lower.includes('nag') || lower.includes('unit') || lower.includes('पीस') || lower.includes('यूनिट') || lower.includes('दर्जन')) unit = 'pieces';
  else if (lower.includes('litre') || lower.includes('ltr') || lower.includes('लीटर')) unit = 'litres';
  else if (lower.includes('can') || lower.includes('tin') || lower.includes('कैन')) unit = 'cans';
  else if (lower.includes('ream') || lower.includes('gatta') || lower.includes('rim') || lower.includes('रीम')) unit = 'reams';

  // 3. Extract price per unit
  let pricePerUnit = 0;
  const priceMatch =
    lower.match(/(?:₹|rs\.?|rupaye|rupees|price|rate|bhav|रुपये|रुपए)\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees|₹|रुपये|रुपए)\s*(?:each|per|\/|में|me)?/i) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:each|per|\/)/i);

  if (priceMatch) {
    pricePerUnit = parseFloat(priceMatch[1]) || 0;
  } else {
    missingFields.push('pricePerUnit');
  }

  // 4. Detect Category & Core Product Noun (Field-First)
  let category = 'Groceries';
  let productNoun = '';

  // Brand detection
  let brand = '';
  if (/parle[- ]?g\b|parle\b/i.test(lower)) brand = 'Parle-G';
  else if (/britannia\s+good\s+day\b|good\s+day\b/i.test(lower)) brand = 'Britannia Good Day';
  else if (/britannia\s+marie\s+gold\b|marie\s+gold\b/i.test(lower)) brand = 'Britannia Marie Gold';
  else if (/britannia\b/i.test(lower)) brand = 'Britannia';
  else if (/oreo\b/i.test(lower)) brand = 'Oreo';
  else if (/dark\s+fantasy\b|sunfeast\b/i.test(lower)) brand = 'Sunfeast Dark Fantasy';
  else if (/bourbon\b/i.test(lower)) brand = 'Bourbon';
  else if (/monaco\b/i.test(lower)) brand = 'Monaco';
  else if (/patanjali\b/i.test(lower)) brand = 'Patanjali';
  else if (/classmate\b/i.test(lower)) brand = 'Classmate';
  else if (/fortune\b/i.test(lower)) brand = 'Fortune';
  else if (/haldiram|bikano|balaji/i.test(lower)) brand = 'Haldiram';

  const BISCUIT_BRANDS = ['Parle-G', 'Britannia Good Day', 'Britannia Marie Gold', 'Britannia', 'Oreo', 'Sunfeast Dark Fantasy', 'Bourbon', 'Monaco'];
  const isBiscuitBrand = BISCUIT_BRANDS.includes(brand);

  if (
    /bisc?u[i]?ts?|bisk[u|i]?ts?|biscute|biskoot|cookie|cookies|rusk|namkeen|chips|bread|cake|bakery|बिस्किट|कुकीज|नमकीन/i.test(lower) ||
    isBiscuitBrand ||
    (brand && /biscuit|bakery/i.test(lower))
  ) {
    category = 'Prepared Food & Bakery';
    if (/cookie|cookies|कुकीज/i.test(lower)) productNoun = brand ? `${brand} Cookies` : 'Cookies';
    else if (/rusk|रस्क/i.test(lower)) productNoun = brand ? `${brand} Rusk` : 'Rusk';
    else if (/namkeen|नमकीन/i.test(lower)) productNoun = brand ? `${brand} Namkeen` : 'Namkeen';
    else if (/chips|चिप्स/i.test(lower)) productNoun = brand ? `${brand} Chips` : 'Chips';
    else if (/bread|ब्रेड/i.test(lower)) productNoun = brand ? `${brand} Bread` : 'Bread';
    else if (isBiscuitBrand || /bisc?u[i]?ts?|bisk[u|i]?ts?|biscute|biskoot|बिस्किट/i.test(lower)) productNoun = brand ? `${brand} Biscuits` : 'Biscuit';
    else productNoun = brand ? `${brand} Bakery Items` : 'Bakery Items';
  } else if (/oil|tel|ghee|rice|chawal|basmati|atta|flour|wheat|gehu|dal|pulses|sugar|cheeni|masala|तेल|चावल|आटा|दाल|चीनी/i.test(lower)) {
    category = 'Groceries';
    if (/fortune.*oil|sunflower.*oil/i.test(lower)) productNoun = 'Fortune Sunflower Oil';
    else if (/oil|tel|तेल/i.test(lower)) productNoun = 'Refined Cooking Oil';
    else if (/basmati|chawal|rice|चावल/i.test(lower)) productNoun = 'Basmati Rice';
    else if (/atta|flour|wheat|आटा|गेहूं/i.test(lower)) productNoun = 'Wheat Atta';
    else if (/dal|pulses|दाल/i.test(lower)) productNoun = 'Pulses / Dal';
    else if (/sugar|cheeni|चीनी/i.test(lower)) productNoun = 'Refined Sugar';
    else productNoun = 'Grocery Stock';
  } else if (/notebook|notebooks|copy|copies|register|pen|pens|paper|stationery|किताब|कॉपी|पेन|कागज/i.test(lower)) {
    category = 'Stationery';
    if (/classmate/i.test(lower)) productNoun = 'Classmate Notebooks';
    else if (/notebook|notebooks|copy|कॉपी/i.test(lower)) productNoun = 'Student Notebooks';
    else if (/pen|pens|पेन/i.test(lower)) productNoun = 'Ballpoint Pens';
    else if (/paper|कागज/i.test(lower)) productNoun = 'A4 Paper Reams';
    else productNoun = 'Office Stationery';
  } else if (/milk|doodh|juice|tea|chai|coffee|beverage|दूध|जूस|चाय|कॉफी/i.test(lower)) {
    category = 'Dairy & Beverages';
    if (/milk|doodh|दूध/i.test(lower)) productNoun = 'Packaged Milk';
    else if (/juice|जूस/i.test(lower)) productNoun = 'Fruit Juice';
    else if (/tea|chai|चाय/i.test(lower)) productNoun = 'Premium Tea';
    else productNoun = 'Beverages';
  } else if (/cable|bulb|led|battery|charger|electronics|केबल|बल्ब|बैटरी|चार्जर/i.test(lower)) {
    category = 'Electronics';
    if (/bulb|led|बल्ब/i.test(lower)) productNoun = 'LED Bulbs';
    else if (/cable|wire|केबल/i.test(lower)) productNoun = 'Charging Cables';
    else productNoun = 'Electronic Accessories';
  } else if (/corrugated|box|boxes|tape|pouch|packing|packaging|कार्टन|टेप|पैकिंग/i.test(lower)) {
    category = 'Packaging';
    if (/box|boxes|कार्टन/i.test(lower)) productNoun = 'Corrugated Boxes';
    else if (/tape|टेप/i.test(lower)) productNoun = 'Packing Tape';
    else productNoun = 'Packaging Materials';
  } else if (/cloth|shirt|fabric|textile|saree|garment|कपड़ा|शर्ट|साड़ी/i.test(lower)) {
    category = 'Textiles';
    if (/shirt|शर्ट/i.test(lower)) productNoun = 'Cotton Shirts';
    else if (/saree|साड़ी/i.test(lower)) productNoun = 'Sarees';
    else productNoun = 'Textile Stock';
  } else if (/pipe|tool|screw|hardware|पाइप|स्क्रू/i.test(lower)) {
    category = 'Hardware';
    productNoun = 'Hardware Tools';
  }

  // If no catalogue product matched, clean conversational fillers from transcript to find product
  if (!productNoun) {
    let cleanText = transcript
      .replace(/[^\w\s\u0900-\u097F]/g, ' ')
      .replace(/\b(mere|hamare|humare|apne)\s+(pa+s+|paas|pass|pas)\b/gi, ' ')
      .replace(/\b(jo\s+me|jo\s+main|jo\s+hum|bech\s+skta\s+hu|bech\s+sakta\s+hu|bechna\s+h|bechna\s+hai|sell\s+karna\s+hai)\b/gi, ' ')
      .replace(/\b(air\s+meri|aur\s+meri|expiry\s+date\s+h|urgency\s+level\s+h|urgency\s+level|urgency\s+h)\b/gi, ' ')
      .replace(/\b(each|per|rate|price|rupees|rupaye|rs)\b/gi, ' ')
      .replace(/\b(din|days|mahine|months|hafte|weeks)\b/gi, ' ')
      .replace(/\b(low|medium|high|कम|मध्यम|जल्दी)\b/gi, ' ')
      .replace(/\b(ke|ka|ki|k|ko|h|hai|hain|packet|packets)\b/gi, ' ')
      .replace(/\b\d+\b/g, ' ')
      .trim();

    const words = cleanText.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      productNoun = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else {
      productNoun = 'Surplus Lot';
      missingFields.push('title');
    }
  }

  // Construct Title: PRODUCT + PACK CONTEXT + LOT SIZE
  const capitalizedUnit = unit.charAt(0).toUpperCase() + unit.slice(1);
  let title = cleanProductTitle(
    `${productNoun} ${capitalizedUnit} (Lot of ${quantity || 1})`,
    category,
    quantity || 1,
    unit,
    transcript
  );

  // 5. Detect Urgency (Explicit values have priority)
  let urgency: 'low' | 'medium' | 'high' = 'low';

  const hasExplicitMed =
    /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*medium\b/i.test(transcript) ||
    /\bmedium\s*(?:urgency|priority)\b/i.test(transcript) ||
    /(?:मीडियम\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*मीडियम|मध्यम|साधारण|நடுத்தர|మధ్యస్థ|মাঝারি|મધ્યમ)/i.test(transcript) ||
    /\b(medium|moderate|normal clearance|20 din|do hafte|2 weeks)\b/i.test(lower);

  const hasExplicitHigh =
    /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*high\b/i.test(transcript) ||
    /\bhigh\s*(?:urgency|priority)\b/i.test(transcript) ||
    /(?:हाई\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*हाई|अत्यंत\s*आवश्यक|तुरंत|जल्दी\s*से\s*जल्दी|इमरजेंसी|अर्जेंट)/i.test(transcript) ||
    /\b(urgent|urgently|emergency|immediate|immediately|turant|aaj hi|short expiry)\b/i.test(lower);

  const hasExplicitLow =
    /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*low\b/i.test(transcript) ||
    /\blow\s*(?:urgency|priority)\b/i.test(transcript) ||
    /(?:लो\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*लो|कम\s*प्राथमिकता|कोई\s*जल्दी\s*नहीं|आराम\s*से)/i.test(transcript) ||
    /\b(koi jaldi nahi|aram se|no hurry|no rush|low urgency)\b/i.test(lower);

  if (hasExplicitMed) {
    urgency = 'medium';
  } else if (hasExplicitHigh) {
    urgency = 'high';
  } else if (hasExplicitLow) {
    urgency = 'low';
  }

  // 6. Parse Expiry Date from transcript dynamically using Indian calendar date
  let expiryDate = '';
  let hasExplicitExpiry = false;
  const todayStr = getIndianDateString();

  // Check explicit ISO date: YYYY-MM-DD
  const isoMatch = lower.match(/\b(202[5-9][-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/);
  if (isoMatch) {
    expiryDate = isoMatch[1].replace(/[/.]/g, '-');
    hasExplicitExpiry = true;
  }

  // Relative days calculation: e.g. "20 din" -> addCalendarDays(todayStr, 20)
  if (!expiryDate) {
    const daysMatch = lower.match(/(\d+)\s*(?:din|days|दिन|दिवस)/i);
    const monthsMatch = lower.match(/(\d+)\s*(?:mahine|months|महीने|माह)/i);
    const weeksMatch = lower.match(/(\d+)\s*(?:hafte|weeks|हफ्ते|सप्ताह)/i);

    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      expiryDate = addCalendarDays(todayStr, Math.max(10, days));
      hasExplicitExpiry = true;
    } else if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1], 10);
      expiryDate = addCalendarDays(todayStr, Math.max(10, weeks * 7));
      hasExplicitExpiry = true;
    } else if (monthsMatch) {
      const months = parseInt(monthsMatch[1], 10);
      expiryDate = addCalendarDays(todayStr, months * 30);
      hasExplicitExpiry = true;
    } else if (lower.includes('agle mahine') || lower.includes('next month') || lower.includes('अगले महीने')) {
      expiryDate = addCalendarDays(todayStr, 30);
      hasExplicitExpiry = true;
    }
  }

  if (urgency === 'high') {
    if (!hasExplicitExpiry) {
      expiryDate = addCalendarDays(todayStr, 12);
      missingFields.push('expiryDate');
    }
  } else if (!expiryDate) {
    expiryDate = addCalendarDays(todayStr, 30);
    missingFields.push('expiryDate');
  }

  // Confidence score
  let confidence = 0.50;
  if (productNoun && productNoun !== 'Surplus Lot') confidence += 0.15;
  if (quantity > 0) confidence += 0.12;
  if (unit) confidence += 0.08;
  if (pricePerUnit > 0) confidence += 0.12;
  if (hasExplicitExpiry) confidence += 0.08;
  if (urgency !== 'low') confidence += 0.06;
  confidence = Math.min(0.96, Math.max(0.45, Math.round(confidence * 100) / 100));

  return {
    title,
    category,
    quantity: quantity || 10,
    unit,
    pricePerUnit: pricePerUnit || 100,
    expiryDate,
    urgency,
    notes: `Lot of ${quantity || 10} ${unit} offered at ₹${pricePerUnit || 100} per ${unit}. Expiry: ${expiryDate}. Urgency: ${urgency}.`,
    confidence,
    missingFields,
  };
}

export async function extractListingFromSpeech(
  transcript: string,
  language: string = 'hi-IN'
): Promise<VoiceExtraction> {
  // If no Gemini API key is configured, gracefully fall back to local rule-based extractor
  if (!config.gemini.apiKey) {
    console.warn('[VoiceService] No GEMINI_API_KEY set. Using rule-based fallback parser.');
    return fallbackRuleBasedExtractor(transcript);
  }

  try {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.gemini.model || 'gemini-3.6-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 1024, // Generous budget so thinking models don't truncate JSON
        responseMimeType: 'application/json',
      },
    });

    const prompt = buildExtractionPrompt(transcript, language);

    // Bounded timeout: 7000ms max to prevent indefinite delays
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini extraction timed out after 7000ms')), 7000);
    });

    const result = (await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ])) as any;

    const response = result.response;
    let text = response.text().trim();

    // Extract JSON block even if model wraps in code fences or conversational text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      text = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(text);
    return sanitizeExtraction(parsed, transcript);
  } catch (err: any) {
    console.warn('[VoiceService] Gemini extraction failed/timed out, using rule-based fallback:', err.message);
    const fallback = fallbackRuleBasedExtractor(transcript);
    return fallback;
  }
}

export async function generateVoiceoverScript(
  extraction: VoiceExtraction,
  language: string = 'hi-IN'
): Promise<{ script: string; language: string; languageName: string }> {
  const langName = LANGUAGE_NAMES[language] || 'Hindi / Hinglish';
  const totalValue = (extraction.quantity || 0) * (extraction.pricePerUnit || 0);

  const urgencyHindi =
    extraction.urgency === 'high' ? 'अत्यंत आवश्यक (हाई)' :
    extraction.urgency === 'medium' ? 'मध्यम (मीडियम)' : 'सामान्य (लो)';

  const urgencyKannada =
    extraction.urgency === 'high' ? 'ತುರ್ತು' :
    extraction.urgency === 'medium' ? 'ಮಧ್ಯಮ' : 'ಸಾಮಾನ್ಯ';

  const urgencyPunjabi =
    extraction.urgency === 'high' ? 'ਜ਼ਰੂਰੀ' :
    extraction.urgency === 'medium' ? 'ਮੱਧਮ' : 'ਆਮ';

  const getFallbackScript = (): string => {
    switch (language) {
      case 'hi-IN':
        return `नमस्ते! आपकी लिस्टिंग का विवरण: उत्पाद है ${extraction.title}, कुल मात्रा ${extraction.quantity} ${extraction.unit}, भाव ₹${extraction.pricePerUnit} प्रति ${extraction.unit}, कुल मूल्य ₹${totalValue} है, एक्सपायरी तारीख ${extraction.expiryDate || 'मानक अवधि'} है, और तात्कालिकता ${urgencyHindi} है।`;
      case 'kn-IN':
        return `ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ ವಿವರಗಳು: ಉತ್ಪನ್ನ ${extraction.title}, ಪ್ರಮಾಣ ${extraction.quantity} ${extraction.unit}, ಬೆಲೆ ₹${extraction.pricePerUnit} ಪ್ರತಿ ${extraction.unit}ಗೆ, ಒಟ್ಟು ಮೌಲ್ಯ ₹${totalValue}, ಮುಕ್ತಾಯ ದಿನಾಂಕ ${extraction.expiryDate || 'ಸಾಮಾನ್ಯ'}, ಮತ್ತು ತುರ್ತುಸ್ಥಿತಿ ${urgencyKannada} ಆಗಿದೆ।`;
      case 'pa-IN':
        return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੀ ਲਿਸਟਿੰਗ ਦੇ ਵੇਰਵੇ: ਉਤਪਾਦ ${extraction.title}, ਮਾਤਰਾ ${extraction.quantity} ${extraction.unit}, ਕੀਮਤ ₹${extraction.pricePerUnit} ਪ੍ਰਤੀ ${extraction.unit}, ਕੁੱਲ ਮੁੱਲ ₹${totalValue}, ਮਿਆਦ ਪੁੱਗਣ ਦੀ ਮਿਤੀ ${extraction.expiryDate || 'ਆਮ'}, ਅਤੇ ਜ਼ਰੂਰੀਤਾ ${urgencyPunjabi} ਹੈ।`;
      default:
        return `Hello! Here is your listing summary: Product is ${extraction.title}, category is ${extraction.category}, available quantity is ${extraction.quantity} ${extraction.unit} at ₹${extraction.pricePerUnit} per ${extraction.unit}. Total lot valuation is ₹${totalValue}. Expiry date is ${extraction.expiryDate || 'Standard Liquidation'} with ${extraction.urgency} urgency level.`;
    }
  };

  if (!config.gemini.apiKey) {
    return { script: getFallbackScript(), language, languageName: langName };
  }

  try {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.gemini.model || 'gemini-3.6-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 800,
      },
    });

    const prompt = `You are an AI assistant for StockBridge, an Indian B2B surplus inventory marketplace.
Create a short, natural, warm, and professional audio voiceover script in ${langName} that will be spoken aloud to the merchant so they can verify their listing details.

Listing Structured Data:
- Product Title: ${extraction.title}
- Category: ${extraction.category}
- Quantity: ${extraction.quantity} ${extraction.unit}
- Price per Unit: ₹${extraction.pricePerUnit}
- Total Lot Value: ₹${totalValue}
- Expiry Date: ${extraction.expiryDate || 'Standard Liquidation'}
- Urgency Level: ${extraction.urgency}

Voiceover Instructions:
1. Write the script strictly in the native script of ${langName} (Devanagari for Hindi, Kannada script for Kannada, Gurmukhi script for Punjabi, Latin script for English) so that Text-To-Speech (TTS) synthesizers pronounce every word accurately.
2. Read out the product name, quantity with unit, price per unit, total lot value, expiry date, and urgency level clearly.
3. CRITICAL: DO NOT mention internal comments or raw transcripts. Only speak the structured listing details.
4. Keep it under 2 sentences so audio readout is quick (10-12 seconds).
5. Return ONLY the plain text voiceover script with no markdown, quotes, asterisks, emojis, or formatting.`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Voiceover generation timed out')), 4000);
    });

    const result = (await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ])) as any;

    let script = result.response.text().trim();
    script = script.replace(/[*#_~`]/g, '').trim();
    return { script: script || getFallbackScript(), language, languageName: langName };
  } catch (err: any) {
    console.warn('[VoiceService] Voiceover script generation error, using fallback:', err.message);
    return { script: getFallbackScript(), language, languageName: langName };
  }
}

