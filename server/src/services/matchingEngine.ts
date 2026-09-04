import prisma from '../lib/prisma';
import { haversineDistance } from '../lib/haversine';

interface MatchInput {
  category?: string;
  search?: string;
  quantity?: number;
  minQuantity?: number;
  maxPricePerUnit?: number;
  maxDistanceKm?: number;
  lat: number;
  lng: number;
}

// Normalize text: lowercase, remove non-alphanumerics, collapse whitespace
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Light English stemmer / singularizer
function stemWord(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  return w;
}

// Levenshtein distance for fuzzy typo matching
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Domain-aware synonym groups
const SYNONYM_GROUPS: string[][] = [
  ['rice', 'basmati', 'chawal', 'paddy', 'grain', 'grains'],
  ['oil', 'sunflower', 'coconut', 'mustard', 'cooking', 'vegetable', 'refined', 'ghee'],
  ['dal', 'toor', 'pulses', 'lentil', 'lentils', 'moong', 'chana', 'urad', 'gram', 'dhal'],
  ['flour', 'atta', 'wheat', 'maida', 'besan', 'baking'],
  ['paper', 'copy', 'ream', 'sheets', 'stationery', 'a4', 'print'],
  ['pen', 'pens', 'ballpoint', 'ink', 'writing'],
  ['notebook', 'notebooks', 'spiral', 'diary', 'book', 'pages', 'register'],
  ['cable', 'cables', 'cord', 'wire', 'usb', 'usbc', 'typec', 'charging', 'charger', 'lightning'],
  ['earbuds', 'earbud', 'earphone', 'earphones', 'headphone', 'headphones', 'tws', 'bluetooth', 'airpods', 'audio'],
  ['lamp', 'lamps', 'light', 'lights', 'led', 'desk', 'lighting', 'bulb'],
  ['bank', 'powerbank', 'battery', 'charger', 'portable', '10000mah'],
  ['box', 'boxes', 'corrugated', 'carton', 'cartons', 'packaging', 'container', 'packing'],
  ['wrap', 'bubble', 'bubblewrap', 'roll', 'packaging', 'film', 'plastic', 'tape'],
  ['cleaner', 'floor', 'detergent', 'sanitizer', 'disinfectant', 'soap', 'wash', 'liquid'],
  ['sanitizer', 'hand', 'alcohol', 'disinfectant', 'cleaner', 'hygiene', 'antiseptic', 'sanitiser'],
  ['mask', 'masks', 'face', 'cotton', 'surgical', 'safety', 'textile', 'protection'],
  ['tea', 'chai', 'green', 'beverage', 'drink', 'beverages', 'leaves'],
  ['groceries', 'grocery', 'food', 'ration', 'provisions', 'staples', 'grains', 'spices'],
  ['electronics', 'electronic', 'gadget', 'gadgets', 'device', 'devices', 'hardware'],
  ['textiles', 'textile', 'cloth', 'fabric', 'garment', 'apparel'],
  ['packaging', 'package', 'packing', 'boxes', 'carton', 'wrapping'],
  ['cleaning', 'housekeeping', 'clean', 'hygiene', 'janitorial'],
];

// Bidirectional synonym map
const SYNONYM_MAP: Map<string, Set<string>> = new Map();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const wNorm = word.toLowerCase();
    const wStem = stemWord(wNorm);
    if (!SYNONYM_MAP.has(wNorm)) SYNONYM_MAP.set(wNorm, new Set());
    if (!SYNONYM_MAP.has(wStem)) SYNONYM_MAP.set(wStem, new Set());

    for (const syn of group) {
      if (syn.toLowerCase() !== wNorm) {
        SYNONYM_MAP.get(wNorm)!.add(syn.toLowerCase());
        SYNONYM_MAP.get(wNorm)!.add(stemWord(syn.toLowerCase()));
        SYNONYM_MAP.get(wStem)!.add(syn.toLowerCase());
        SYNONYM_MAP.get(wStem)!.add(stemWord(syn.toLowerCase()));
      }
    }
  }
}

// Fuzzy match single query word against list of target words
function matchWordAgainstTargets(queryWord: string, targetWords: string[]): number {
  const qNorm = queryWord.toLowerCase().trim();
  const qStem = stemWord(qNorm);
  if (!qNorm) return 0;
  let bestScore = 0;

  for (const target of targetWords) {
    const tNorm = target.toLowerCase().trim();
    const tStem = stemWord(tNorm);
    if (!tNorm) continue;

    // 1. Exact word or stem match (1.0)
    if (tNorm === qNorm || tStem === qStem) return 1.0;

    // 2. Prefix matching (ratio must be >= 0.75)
    if (qNorm.length >= 3 && tNorm.length >= 3) {
      if (tNorm.startsWith(qNorm) || qNorm.startsWith(tNorm) || tStem.startsWith(qStem) || qStem.startsWith(tStem)) {
        const ratio = Math.min(qNorm.length, tNorm.length) / Math.max(qNorm.length, tNorm.length);
        if (ratio >= 0.75) {
          bestScore = Math.max(bestScore, ratio * 0.95);
        }
      }
    }

    // 3. Typo distance (Levenshtein) for words >= 4 chars
    if (qStem.length >= 4 && tStem.length >= 4) {
      const lenDiff = Math.abs(qStem.length - tStem.length);
      if (lenDiff <= 1) {
        const dist = levenshteinDistance(qStem, tStem);
        if (dist === 1) {
          bestScore = Math.max(bestScore, 0.88);
        }
      }
    }
  }

  // 4. Synonym match
  const synonyms = SYNONYM_MAP.get(qNorm) || SYNONYM_MAP.get(qStem);
  if (synonyms) {
    for (const syn of synonyms) {
      const synNorm = syn.toLowerCase();
      const synStem = stemWord(synNorm);
      for (const target of targetWords) {
        const tNorm = target.toLowerCase();
        const tStem = stemWord(tNorm);
        if (tNorm === synNorm || tStem === synStem) {
          bestScore = Math.max(bestScore, 0.90);
        } else if (tNorm.length >= 4 && synNorm.length >= 4) {
          const ratio = Math.min(tStem.length, synStem.length) / Math.max(tStem.length, synStem.length);
          if (ratio >= 0.80 && (tNorm.startsWith(synStem) || synStem.startsWith(tStem))) {
            bestScore = Math.max(bestScore, 0.85);
          }
        }
      }
    }
  }

  return bestScore;
}

// Calculate text relevance score (0 to 1) for a listing against query
function calculateTextRelevance(query: string, listing: any): { score: number; matchedTerms: string[] } {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return { score: 1.0, matchedTerms: [] };

  const titleNorm = normalizeText(listing.title);
  const categoryNorm = normalizeText(listing.category);
  const sellerNameNorm = normalizeText(listing.seller?.businessName || listing.seller?.name || '');

  // Exact full phrase in title -> immediate 1.0
  if (titleNorm.includes(normalizedQuery)) {
    return { score: 1.0, matchedTerms: [listing.title] };
  }

  const queryWords = normalizedQuery.split(' ').filter((w) => w.length > 0);
  if (queryWords.length === 0) return { score: 1.0, matchedTerms: [] };

  const titleWords = titleNorm.split(' ').filter((w) => w.length > 0);
  const categoryWords = categoryNorm.split(' ').filter((w) => w.length > 0);
  const sellerWords = sellerNameNorm.split(' ').filter((w) => w.length > 0);

  const matchedTerms: string[] = [];
  let titleScoreSum = 0;
  let categoryScoreSum = 0;

  for (const qWord of queryWords) {
    const titleWordScore = matchWordAgainstTargets(qWord, titleWords);
    const categoryWordScore = matchWordAgainstTargets(qWord, categoryWords);
    const sellerWordScore = matchWordAgainstTargets(qWord, sellerWords);

    const bestWordScore = Math.max(titleWordScore, categoryWordScore, sellerWordScore * 0.6);

    if (bestWordScore >= 0.7) {
      matchedTerms.push(qWord);
    }

    titleScoreSum += titleWordScore;
    categoryScoreSum += categoryWordScore;
  }

  const avgTitleScore = titleScoreSum / queryWords.length;
  const avgCategoryScore = categoryScoreSum / queryWords.length;

  // Title match receives primary weight
  let combined = avgTitleScore * 0.85 + avgCategoryScore * 0.15;

  // If all query words matched in title
  if (matchedTerms.length === queryWords.length && queryWords.length > 1) {
    combined = Math.max(combined, 0.95);
  }

  return { score: Math.min(1, Math.max(0, combined)), matchedTerms };
}

export async function matchListings(input: MatchInput): Promise<any[]> {
  // Fetch active listings from database
  const where: any = {
    status: 'active',
    active: true,
  };

  if (input.category && input.category !== 'All Categories') {
    where.category = input.category;
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          businessName: true,
          rating: true,
          lat: true,
          lng: true,
          address: true,
        },
      },
    },
  });

  if (listings.length === 0) return [];

  const avgPrice = listings.reduce((s, l) => s + l.pricePerUnit, 0) / listings.length;
  const hasSearch = Boolean(input.search && input.search.trim().length > 0);
  const maxDistance = input.maxDistanceKm ? Number(input.maxDistanceKm) : 50;

  const scoredListings = listings
    .map((listing) => {
      const reasons: string[] = [];

      // 1. Text Relevance Score
      let textScore = 1.0;
      if (hasSearch) {
        const { score, matchedTerms } = calculateTextRelevance(input.search!, listing);
        textScore = score;
        if (textScore >= 0.8) {
          reasons.push(`High keyword match for "${input.search}"`);
        } else if (textScore >= 0.5) {
          reasons.push(`Matched terms: ${matchedTerms.join(', ') || input.search}`);
        }
      }

      // If search query is provided and listing has negligible relevance, drop it
      if (hasSearch && textScore < 0.45) {
        return null;
      }

      // 2. Distance Score (Haversine)
      const rawDist = haversineDistance(
        input.lat,
        input.lng,
        listing.seller.lat,
        listing.seller.lng
      );

      // Hard filter: reject listings exceeding radius (unless radius >= 100 which represents All Distances)
      if (maxDistance < 100 && rawDist > maxDistance) {
        return null;
      }

      // Fix 0km: If seller is at exact same lat/lng coordinates or < 0.2km, represent realistic local vicinity
      const dist = rawDist < 0.2 ? 0.8 : Math.round(rawDist * 10) / 10;
      const distScore = Math.max(0.2, 1 - (dist / maxDistance) * 0.7);

      if (dist < 2) reasons.push(`Very close (${dist < 1 ? '< 1' : dist.toFixed(1)} km)`);
      else if (dist < 10) reasons.push(`Nearby (${dist.toFixed(1)} km)`);
      else reasons.push(`Within radius (${dist.toFixed(1)} km)`);

      // 3. Price Suitability Score
      let priceScore = 0.5;
      if (input.maxPricePerUnit && input.maxPricePerUnit > 0) {
        if (listing.pricePerUnit <= input.maxPricePerUnit) {
          priceScore = 1.0;
          reasons.push(`Within budget (₹${listing.pricePerUnit} ≤ ₹${input.maxPricePerUnit})`);
        } else {
          // Gracefully scale down instead of hard filtering out
          const overage = (listing.pricePerUnit - input.maxPricePerUnit) / input.maxPricePerUnit;
          priceScore = Math.max(0.1, 1 - overage * 0.8);
          if (priceScore > 0.6) {
            reasons.push(`Near budget target (₹${listing.pricePerUnit})`);
          }
        }
      } else {
        const priceRatio = listing.pricePerUnit / (avgPrice || 1);
        priceScore = Math.max(0.2, Math.min(1, 2 - priceRatio));
        if (priceRatio < 0.9) reasons.push('Discounted liquidation rate');
      }

      // 4. Quantity Suitability Score
      let quantityScore = 1.0;
      if (input.minQuantity && input.minQuantity > 0) {
        if (listing.quantity >= input.minQuantity) {
          quantityScore = 1.0;
        } else {
          quantityScore = Math.max(0.3, listing.quantity / input.minQuantity);
        }
      }

      // 5. Urgency Score
      const urgencyMap: Record<string, number> = { high: 1.0, medium: 0.7, low: 0.4 };
      const urgencyScore = urgencyMap[listing.urgency] || 0.4;
      if (listing.urgency === 'high') reasons.push('Urgent clearance sale');

      // 6. Expiry Score (sooner expiry = higher moving priority)
      let expiryScore = 0.5;
      if (listing.expiryDate) {
        const daysToExpiry =
          (new Date(listing.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysToExpiry <= 0) expiryScore = 0.1;
        else if (daysToExpiry <= 3) {
          expiryScore = 1.0;
          reasons.push('Expiring very soon (<3 days)');
        } else if (daysToExpiry <= 7) {
          expiryScore = 0.85;
          reasons.push('Expiring this week');
        } else if (daysToExpiry <= 30) {
          expiryScore = 0.7;
          reasons.push('Expiring within 30 days');
        } else {
          expiryScore = 0.4;
        }
      }

      // 7. Seller Rating Score
      const ratingScore = Math.min(1, (listing.seller.rating || 4.5) / 5);
      if (listing.seller.rating >= 4.5) reasons.push(`Top rated seller (${listing.seller.rating.toFixed(1)}★)`);

      // Weighted Composite Score
      let totalScore: number;
      if (hasSearch) {
        totalScore =
          0.48 * textScore +
          0.20 * distScore +
          0.14 * priceScore +
          0.06 * quantityScore +
          0.06 * urgencyScore +
          0.03 * expiryScore +
          0.03 * ratingScore;
      } else {
        totalScore =
          0.30 * distScore +
          0.25 * priceScore +
          0.15 * quantityScore +
          0.15 * urgencyScore +
          0.10 * expiryScore +
          0.05 * ratingScore;
      }

      return {
        ...listing,
        matchScore: Math.min(100, Math.max(10, Math.round(totalScore * 100))),
        distanceKm: Math.round(dist * 10) / 10,
        textMatchScore: Math.round(textScore * 100),
        reasons,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Sort by highest matchScore descending
  scoredListings.sort((a, b) => b.matchScore - a.matchScore);

  return scoredListings;
}
