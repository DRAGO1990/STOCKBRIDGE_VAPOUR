import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { calculateUrgencyFromExpiry } from '../utils/urgency';

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
  mrp: number | null;
  pricePerUnit: number;
  expiryDate: string | null;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
  confidence: number;
  missingFields: string[];
}

function buildExtractionPrompt(transcript: string, language: string): string {
  const langName = LANGUAGE_NAMES[language] || 'Hindi / Hinglish / English';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Default suggested expiry date is 30 days from today (must be at least 10 days)
  const defaultMinDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const defaultExpiryStr = defaultMinDate.toISOString().split('T')[0];

  return `You are an expert AI parser for StockBridge, an Indian B2B surplus inventory and dead stock liquidation marketplace.

A shopkeeper / distributor / merchant spoke the following voice description in ${langName}.
Analyze the transcript, interpret all Indian colloquial terms, measurements, numbers, and produce structured, professional listing data.

SPEECH TRANSCRIPT:
"${transcript}"

TODAY'S DATE: ${todayStr}

EXTRACTION RULES & DOMAIN KNOWLEDGE:
1. "title":
   - Craft a clean, professional, polished B2B product listing title in standard English with Proper Capitalization.
   - Include Brand Name (if mentioned), Product Name, Variant/Weight/Size specification, and pack context.
   - Example 1: If speech says "fortune oil 1 litre 50 packet bacha hai", title should be: "Fortune Sunlite Refined Sunflower Oil 1L Pouch (Lot of 50)"
   - Example 2: If speech says "25 bori daawat basmati chawal 25kg", title should be: "Daawat Traditional Basmati Rice 25kg Bags (Lot of 25)"
   - Example 3: If speech says "classmate notebook 200 piece", title should be: "Classmate Single Line Long Notebooks (Lot of 200)"
   - Do NOT leave raw Hindi/Hinglish phonetic words in title. Translate to professional English terms.

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
   - "darjan", "dozen" -> "pieces" (1 dozen = 12 pieces; if user said "5 darjan", quantity is 60 pieces)
   - "nag", "piece", "pcs", "piece", "unit" -> "pieces"
   - "kilo", "kg", "kilogram" -> "kg"
   - "litre", "ltr", "l" -> "litres"
   - "tin", "can" -> "cans"
   - "gatta", "rim", "ream" -> "reams"

4. "quantity":
   - Extract the total number as an integer or float > 0.
   - Understand Indian spoken number words (e.g., "ek"=1, "do"=2, "paanch"=5, "das"=10, "bees"=20, "pachees"=25, "pachaas"=50, "sau"=100, "dedh sau"=150, "do sau"=200, "paanch sau"=500, "hazaar"=1000).

5. "mrp":
   - Maximum Retail Price in INR (look for phrases like "MRP", "printed price", "chapa hua daam", "printed rate", "pack MRP").
   - If MRP is not mentioned or cannot be determined, set to null and include "mrp" in "missingFields".
   - Do NOT guess or fabricate an MRP if not explicitly spoken.

6. "pricePerUnit":
   - Price in Indian Rupees (₹) per single unit.
   - If a total lot price is quoted (e.g. "sab milake 5000 rupaye" for 50 units), calculate: 5000 / 50 = 100.
   - If rate per unit is quoted (e.g. "120 rupaye per packet"), pricePerUnit = 120.

7. "expiryDate":
   - Must be ISO format YYYY-MM-DD.
   - Interpret relative phrases: "agle mahine" / "next month" (+30 days), "15 din baad" (+15 days), "2 mahine baad" (+60 days), "6 mahine" (+180 days), "saal ke aakhir tak" (end of year).
   - If no expiry date is stated or if it is a non-perishable product, set it to "${defaultExpiryStr}" and include "expiryDate" in "missingFields".

8. "urgency":
   - IMPORTANT: Do NOT determine urgency. Urgency is calculated dynamically by the application based strictly on product expiry date. Return "low" as placeholder.

9. "notes":
   - Clean summary of condition, packaging state, reasons for surplus, discounts, or special handling mentioned by the seller.

10. "confidence": Number between 0.0 and 1.0 based on how complete and clear the speech was.

11. "missingFields": Array of field names that were not explicitly mentioned in the speech (e.g. ["expiryDate", "mrp"]).

OUTPUT JSON SCHEMA:
{
  "title": string,
  "category": string,
  "quantity": number,
  "unit": string,
  "mrp": number | null,
  "pricePerUnit": number,
  "expiryDate": string,
  "urgency": "low" | "medium" | "high",
  "notes": string,
  "confidence": number,
  "missingFields": string[]
}
`;
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

  // Parse MRP
  let mrp: number | null = null;
  if (raw.mrp !== undefined && raw.mrp !== null) {
    const parsedMrp = Number(raw.mrp);
    if (!isNaN(parsedMrp) && parsedMrp > 0) {
      mrp = parsedMrp;
    }
  }

  let expiryDate: string | null = null;
  let hasExplicitExpiry = false;

  if (raw.expiryDate) {
    const parsed = new Date(raw.expiryDate);
    if (!isNaN(parsed.getTime())) {
      expiryDate = parsed.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    }
  }

  if (!expiryDate) {
    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expiryDate = defaultDate.toISOString().split('T')[0];
  }

  // Dynamic urgency is strictly determined by expiry date:
  const calculatedUrgency = calculateUrgencyFromExpiry(expiryDate).urgency;

  const missingFields: string[] = Array.isArray(raw.missingFields) ? raw.missingFields.map(String) : [];
  if (!hasExplicitExpiry && !missingFields.includes('expiryDate')) {
    missingFields.push('expiryDate');
  }
  if (mrp === null && !missingFields.includes('mrp')) {
    missingFields.push('mrp');
  }

  // Calculate dynamic confidence score based on actual field matches
  let calculatedConfidence = 0.50;
  const rawTitle = String(raw.title || '').trim();
  if (rawTitle && rawTitle !== 'Surplus Lot') calculatedConfidence += 0.12;
  if (Number(raw.quantity) > 0) calculatedConfidence += 0.12;
  if (VALID_UNITS.includes(unit)) calculatedConfidence += 0.08;
  if (Number(raw.pricePerUnit) > 0) calculatedConfidence += 0.12;
  if (mrp !== null) calculatedConfidence += 0.08;
  if (hasExplicitExpiry) calculatedConfidence += 0.08;

  let finalConfidence = Number(raw.confidence);
  if (isNaN(finalConfidence) || finalConfidence <= 0 || finalConfidence === 0.65) {
    finalConfidence = calculatedConfidence;
  }
  finalConfidence = Math.min(0.98, Math.max(0.40, Math.round(finalConfidence * 100) / 100));

  return {
    title: rawTitle,
    category,
    quantity: Math.max(0, Number(raw.quantity) || 0),
    unit,
    mrp,
    pricePerUnit: Math.max(0, Number(raw.pricePerUnit) || 0),
    expiryDate,
    urgency: calculatedUrgency,
    notes: String(raw.notes || '').trim(),
    confidence: finalConfidence,
    missingFields,
  };
}

/**
 * Robust local fallback parser using regular expressions and heuristics
 * when the AI API is unreachable or unconfigured.
 */
function fallbackRuleBasedExtractor(transcript: string): VoiceExtraction {
  const lower = transcript.toLowerCase();
  const missingFields: string[] = [];

  // Extract quantity
  let quantity = 0;
  const qtyMatch = lower.match(/(\d+)\s*(kg|kilo|bag|bori|katta|packet|pauchi|pouch|piece|pcs|box|peti|can|litre|ltr|ream|पैकेट|कट्टे|बोरी|पेटी|डिब्बा|पीस|यूनिट|लीटर|किलो)/i) ||
    lower.match(/(\d+)/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10) || 0;
  } else {
    // Number words
    if (lower.includes('pachaas') || lower.includes('fifty') || lower.includes('पचास')) quantity = 50;
    else if (lower.includes('sau') || lower.includes('hundred') || lower.includes('सौ')) quantity = 100;
    else if (lower.includes('bees') || lower.includes('twenty') || lower.includes('बीस')) quantity = 20;
    else if (lower.includes('das') || lower.includes('ten') || lower.includes('दस')) quantity = 10;
    else if (lower.includes('pachees') || lower.includes('twenty five') || lower.includes('पच्चीस')) quantity = 25;
    else missingFields.push('quantity');
  }

  // Extract unit
  let unit = 'packets';
  if (lower.includes('kg') || lower.includes('kilo') || lower.includes('किलो')) unit = 'kg';
  else if (lower.includes('bori') || lower.includes('katta') || lower.includes('bag') || lower.includes('बोरी') || lower.includes('कट्टा') || lower.includes('कट्टे')) unit = 'bags';
  else if (lower.includes('peti') || lower.includes('dabba') || lower.includes('box') || lower.includes('पेटी') || lower.includes('डिब्बा') || lower.includes('बॉक्स')) unit = 'boxes';
  else if (lower.includes('carton') || lower.includes('khokha') || lower.includes('कार्टन') || lower.includes('खोखा')) unit = 'cartons';
  else if (lower.includes('packet') || lower.includes('pauchi') || lower.includes('pouch') || lower.includes('पैकेट') || lower.includes('पाउच') || lower.includes('पुड़िया')) unit = 'packets';
  else if (lower.includes('piece') || lower.includes('pcs') || lower.includes('darjan') || lower.includes('nag') || lower.includes('unit') || lower.includes('पीस') || lower.includes('यूनिट') || lower.includes('दर्जन') || lower.includes('नग')) unit = 'pieces';
  else if (lower.includes('litre') || lower.includes('ltr') || lower.includes('लीटर')) unit = 'litres';
  else if (lower.includes('can') || lower.includes('tin') || lower.includes('कैन') || lower.includes('टिन')) unit = 'cans';
  else if (lower.includes('ream') || lower.includes('gatta') || lower.includes('rim') || lower.includes('रीम')) unit = 'reams';

  // Extract MRP from transcript (Hindi phrases & English)
  let mrp: number | null = null;
  const mrpMatch =
    lower.match(/(?:mrp|printed price|chapa hua daam|chapa daam|chape huye daam|printed rate)\s*(?:rs\.?|rupees|₹|:)?\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(?:mrp)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (mrpMatch) {
    mrp = parseFloat(mrpMatch[1]) || null;
  } else {
    missingFields.push('mrp');
  }

  // Extract price
  let pricePerUnit = 0;
  // If MRP was matched, make sure we find selling price by avoiding matching the same MRP number
  const priceMatches = [
    ...lower.matchAll(/(?:rate|bhav|humara rate|price|selling price|bechna hai|bechna)\s*(?:rs\.?|rupees|₹|:|\s)?\s*(\d+(?:\.\d+)?)/gi),
  ];
  if (priceMatches.length > 0) {
    pricePerUnit = parseFloat(priceMatches[0][1]) || 0;
  } else {
    const generalPriceMatch =
      lower.match(/(?:₹|rs\.?|rupaye|rupees|रुपये|रुपए|per|\/|में|me)\s*(\d+(?:\.\d+)?)/i) ||
      lower.match(/(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupaye|rupees|रुपये|रुपए|per|\/|में|me)/i);
    if (generalPriceMatch) {
      const val = parseFloat(generalPriceMatch[1]) || 0;
      if (val !== mrp) {
        pricePerUnit = val;
      }
    }
  }

  if (!pricePerUnit) {
    if (mrp) {
      pricePerUnit = Math.round(mrp * 0.8);
    } else {
      missingFields.push('pricePerUnit');
    }
  }

  // Detect category
  let category = 'Groceries';
  if (lower.includes('oil') || lower.includes('rice') || lower.includes('chawal') || lower.includes('atta') || lower.includes('dal') || lower.includes('sugar') || lower.includes('masala') || lower.includes('तेल') || lower.includes('चावल') || lower.includes('आटा') || lower.includes('दाल') || lower.includes('चीनी') || lower.includes('मसाला')) {
    category = 'Groceries';
  } else if (lower.includes('milk') || lower.includes('doodh') || lower.includes('juice') || lower.includes('tea') || lower.includes('coffee') || lower.includes('beverage') || lower.includes('दूध') || lower.includes('जूस') || lower.includes('चाय') || lower.includes('कॉफी')) {
    category = 'Dairy & Beverages';
  } else if (lower.includes('biscuit') || lower.includes('chips') || lower.includes('namkeen') || lower.includes('bread') || lower.includes('cake') || lower.includes('bakery') || lower.includes('बिस्किट') || lower.includes('चिप्स') || lower.includes('नमकीन') || lower.includes('ब्रेड') || lower.includes('केक') || lower.includes('बेकरी')) {
    category = 'Prepared Food & Bakery';
  } else if (lower.includes('book') || lower.includes('notebook') || lower.includes('pen') || lower.includes('paper') || lower.includes('stationery') || lower.includes('किताब') || lower.includes('कॉपी') || lower.includes('पेन') || lower.includes('कागज')) {
    category = 'Stationery';
  } else if (lower.includes('cable') || lower.includes('bulb') || lower.includes('battery') || lower.includes('charger') || lower.includes('electronics') || lower.includes('केबल') || lower.includes('बल्ब') || lower.includes('बैटरी') || lower.includes('चार्जर')) {
    category = 'Electronics';
  } else if (lower.includes('box') || lower.includes('tape') || lower.includes('pouch') || lower.includes('packing') || lower.includes('packaging') || lower.includes('टेप') || lower.includes('पैकिंग')) {
    category = 'Packaging';
  } else if (lower.includes('cloth') || lower.includes('shirt') || lower.includes('fabric') || lower.includes('textile') || lower.includes('कपड़ा') || lower.includes('शर्ट') || lower.includes('साड़ी')) {
    category = 'Textiles';
  } else if (lower.includes('pipe') || lower.includes('tool') || lower.includes('screw') || lower.includes('hardware') || lower.includes('पाइप') || lower.includes('हथौड़ा') || lower.includes('स्क्रू')) {
    category = 'Hardware';
  }

  // Parse Expiry Date from transcript
  let expiryDate = '';
  let hasExplicitExpiry = false;

  // Check ISO format YYYY-MM-DD
  const isoMatch = lower.match(/\b(202[5-9][-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/);
  if (isoMatch) {
    expiryDate = isoMatch[1].replace(/[/.]/g, '-');
    hasExplicitExpiry = true;
  }

  // Check relative timeframes: e.g. "20 din", "2 mahine", "3 months"
  if (!expiryDate) {
    const daysMatch = lower.match(/(\d+)\s*(?:din|days|दिन|दिवस)/i);
    const monthsMatch = lower.match(/(\d+)\s*(?:mahine|months|महीने|माह)/i);
    const weeksMatch = lower.match(/(\d+)\s*(?:hafte|weeks|हफ्ते|सप्ताह)/i);

    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      const target = new Date(Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    } else if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1], 10);
      const target = new Date(Date.now() + Math.max(1, weeks * 7) * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    } else if (monthsMatch) {
      const months = parseInt(monthsMatch[1], 10);
      const target = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    } else if (lower.includes('agle mahine') || lower.includes('next month') || lower.includes('अगले महीने')) {
      const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    }
  }

  if (!expiryDate) {
    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expiryDate = defaultDate.toISOString().split('T')[0];
    missingFields.push('expiryDate');
  }

  // Urgency is computed deterministically from expiryDate
  const urgency = calculateUrgencyFromExpiry(expiryDate).urgency;

  // Title formatting: Clean capitalized words
  let title = transcript
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (!title) {
    title = 'Surplus Lot';
    missingFields.push('title');
  } else {
    title = `${title} (${quantity || 1} ${unit})`;
  }

  // Dynamic confidence score calculation based on extracted fields
  let confidence = 0.50;
  if (title && title !== 'Surplus Lot') confidence += 0.12;
  if (quantity > 0) confidence += 0.12;
  if (unit) confidence += 0.08;
  if (pricePerUnit > 0) confidence += 0.12;
  if (mrp !== null) confidence += 0.08;
  if (hasExplicitExpiry) confidence += 0.08;
  confidence = Math.min(0.96, Math.max(0.45, Math.round(confidence * 100) / 100));

  return {
    title,
    category,
    quantity: quantity || 10,
    unit,
    mrp,
    pricePerUnit: pricePerUnit || 100,
    expiryDate,
    urgency,
    notes: 'Parsed from voice input. Please verify lot specifications before publishing.',
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
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const prompt = buildExtractionPrompt(transcript, language);
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // Extract JSON block even if model wraps in code fences or conversational text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      text = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(text);
    return sanitizeExtraction(parsed);
  } catch (err: any) {
    console.warn('[VoiceService] Gemini extraction failed, using fallback:', err.message);
    // Fall back to rule-based parser on any API failure so user workflow never breaks
    const fallback = fallbackRuleBasedExtractor(transcript);
    return fallback;
  }
}

export async function generateVoiceoverScript(
  extraction: VoiceExtraction,
  language: string = 'hi-IN'
): Promise<{ script: string; language: string; languageName: string }> {
  const langName = LANGUAGE_NAMES[language] || 'Hindi (in Devanagari script)';
  const totalValue = (extraction.quantity || 0) * (extraction.pricePerUnit || 0);

  const getFallbackScript = (): string => {
    switch (language) {
      case 'hi-IN':
        return `नमस्ते! आपकी लिस्टिंग का विवरण: उत्पाद है ${extraction.title}, कुल मात्रा ${extraction.quantity} ${extraction.unit}, भाव ₹${extraction.pricePerUnit} प्रति ${extraction.unit}, कुल मूल्य ₹${totalValue} है, एक्सपायरी तारीख ${extraction.expiryDate || 'मानक अवधि'} है, और तात्कालिकता ${extraction.urgency === 'high' ? 'अत्यंत आवश्यक' : extraction.urgency === 'medium' ? 'मध्यम' : 'सामान्य'} है।`;
      case 'bn-IN':
        return `নমস্কার! আপনার লিস্টিং বিবরণ: পণ্য ${extraction.title}, পরিমাণ ${extraction.quantity} ${extraction.unit}, দর ₹${extraction.pricePerUnit} প্রতি ${extraction.unit}, মোট মূল্য ₹${totalValue}, মেয়াদ ${extraction.expiryDate || 'সাধারণ'} এবং অগ্রাধিকার ${extraction.urgency === 'high' ? 'জরুরি' : 'সাধারণ'}।`;
      case 'mr-IN':
        return `नमस्कार! आपल्या लिस्टिंगचा तपशील: उत्पादन ${extraction.title}, प्रमाण ${extraction.quantity} ${extraction.unit}, दर ₹${extraction.pricePerUnit} प्रति ${extraction.unit}, एकूण मूल्य ₹${totalValue}, समाप्ती तारीख ${extraction.expiryDate || 'मानक'} आणि निकड ${extraction.urgency === 'high' ? 'तातडीची' : 'सामान्य'} आहे।`;
      case 'ta-IN':
        return `வணக்கம்! உங்கள் பட்டியல் விவரங்கள்: தயாரிப்பு ${extraction.title}, அளவு ${extraction.quantity} ${extraction.unit}, விலை ₹${extraction.pricePerUnit} ஒரு ${extraction.unit}க்கு, மொத்த மதிப்பு ₹${totalValue}, காலாவதி தேதி ${extraction.expiryDate || 'வழக்கமான'}, மற்றும் அவசரம் ${extraction.urgency === 'high' ? 'உடனடி' : 'சாதாரண'}।`;
      case 'te-IN':
        return `నమస్కారం! మీ లిస్టింగ్ వివరాలు: ఉత్పత్తి ${extraction.title}, పరిమాణం ${extraction.quantity} ${extraction.unit}, ధర ₹${extraction.pricePerUnit} ప్రతి ${extraction.unit}కి, మొత్తం విలువ ₹${totalValue}, గడువు తేదీ ${extraction.expiryDate || 'సాధారణం'}, మరియు అత్యవసరత ${extraction.urgency === 'high' ? 'అత్యవసరం' : 'సాధారణం'}।`;
      case 'gu-IN':
        return `નમસ્તે! તમારી લિસ્ટિંગ વિગતો: ઉત્પાદન ${extraction.title}, જથ્થો ${extraction.quantity} ${extraction.unit}, કિંમત ₹${extraction.pricePerUnit} પ્રતિ ${extraction.unit}, કુલ મૂલ્ય ₹${totalValue}, એક્સપાયરી તારીખ ${extraction.expiryDate || 'સામાન્ય'}, અને તાકીદ ${extraction.urgency === 'high' ? 'ખૂબ જરૂરી' : 'સામાન્ય'} છે।`;
      case 'kn-IN':
        return `ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ ವಿವರಗಳು: ಉತ್ಪನ್ನ ${extraction.title}, ಪ್ರಮಾಣ ${extraction.quantity} ${extraction.unit}, ಬೆಲೆ ₹${extraction.pricePerUnit} ಪ್ರತಿ ${extraction.unit}ಗೆ, ಒಟ್ಟು ಮೌಲ್ಯ ₹${totalValue}, ಮುಕ್ತಾಯ ದಿನಾಂಕ ${extraction.expiryDate || 'ಸಾಮಾನ್ಯ'}, ಮತ್ತು ತುರ್ತುಸ್ಥಿತಿ ${extraction.urgency === 'high' ? 'ತುರ್ತು' : 'ಸಾಮಾನ್ಯ'}।`;
      case 'ml-IN':
        return `നമസ്കാരം! നിങ്ങളുടെ ലിസ്റ്റിംഗ് വിവരങ്ങൾ: ഉൽപ്പന്നം ${extraction.title}, അളവ് ${extraction.quantity} ${extraction.unit}, വില ₹${extraction.pricePerUnit} പ്രതി ${extraction.unit}ന്, ആകെ മൂല്യം ₹${totalValue}, കാലാവധി ${extraction.expiryDate || 'സാധാരണ'}, അടിയന്തിരാവസ്ഥ ${extraction.urgency === 'high' ? 'അടിയന്തിരം' : 'സാധാരണ'}।`;
      case 'pa-IN':
        return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੀ ਲਿਸਟਿੰਗ ਦੇ ਵੇਰਵੇ: ਉਤਪਾਦ ${extraction.title}, ਮਾਤਰਾ ${extraction.quantity} ${extraction.unit}, ਕੀਮਤ ₹${extraction.pricePerUnit} ਪ੍ਰਤੀ ${extraction.unit}, ਕੁੱਲ ਮੁੱਲ ₹${totalValue}, ਮਿਆਦ ਪੁੱਗਣ ਦੀ ਮਿਤੀ ${extraction.expiryDate || 'ਆਮ'}, ਅਤੇ ਜ਼ਰੂਰੀਤਾ ${extraction.urgency === 'high' ? 'ਜ਼ਰੂਰੀ' : 'ਆਮ'} ਹੈ।`;
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
        maxOutputTokens: 1024,
      },
    });

    const prompt = `You are an AI assistant for StockBridge, an Indian B2B surplus inventory marketplace.
Create a short, natural, warm, and professional audio voiceover script in ${langName} that will be spoken aloud to the merchant so they can verify their listing details.

Listing Data:
- Product Title: ${extraction.title}
- Category: ${extraction.category}
- Quantity: ${extraction.quantity} ${extraction.unit}
- Price per Unit: ₹${extraction.pricePerUnit}
- Total Lot Value: ₹${totalValue}
- Expiry Date: ${extraction.expiryDate || 'Standard Liquidation'}
- Urgency Level: ${extraction.urgency}

Voiceover Instructions:
1. Write the script strictly in the native script of ${langName} (Devanagari for Hindi/Marathi, Tamil script for Tamil, Telugu script for Telugu, Bengali script for Bengali, Gujarati script for Gujarati, Kannada script for Kannada, Malayalam script for Malayalam, Gurmukhi script for Punjabi, English Latin script for English) so that Text-To-Speech (TTS) synthesizers pronounce every word accurately. Do not write Romanized transliterations.
2. Read out the product name, quantity with unit, price per unit, total lot value, expiry date, and urgency level clearly.
3. CRITICAL: DO NOT mention or read out "AI Extracted Notes", special notes, delivery radius, or internal comments. Only speak the product, quantity, unit, price, total value, expiry date, and urgency.
4. Keep it under 2-3 concise, clear sentences so audio readout is quick (12-16 seconds).
5. Return ONLY the plain text voiceover script with no markdown, quotes, asterisks, emojis, or formatting.`;

    const result = await model.generateContent(prompt);
    let script = result.response.text().trim();
    script = script.replace(/[*#_~`]/g, '').trim();
    return { script: script || getFallbackScript(), language, languageName: langName };
  } catch (err: any) {
    console.warn('[VoiceService] Voiceover script generation error, using fallback:', err.message);
    return { script: getFallbackScript(), language, languageName: langName };
  }
}
