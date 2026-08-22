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

export async function matchListings(input: MatchInput): Promise<any[]> {
  const where: any = {
    status: 'active',
    active: true,
  };

  if (input.category) {
    where.category = input.category;
  }

  if (input.search) {
    where.OR = [
      { title: { contains: input.search } },
      { category: { contains: input.search } },
    ];
  }

  if (input.minQuantity) {
    where.quantity = { gte: input.minQuantity };
  }

  if (input.maxPricePerUnit) {
    where.pricePerUnit = { lte: input.maxPricePerUnit };
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      seller: {
        select: { id: true, name: true, businessName: true, rating: true, lat: true, lng: true, address: true },
      },
    },
  });

  if (listings.length === 0) return [];

  // Category average price
  const avgPrice = listings.reduce((s, l) => s + l.pricePerUnit, 0) / listings.length;

  const scored = listings.map((listing) => {
    const reasons: string[] = [];

    // Distance score (0-1, closer = higher)
    const dist = haversineDistance(input.lat, input.lng, listing.seller.lat, listing.seller.lng);
    const maxDist = input.maxDistanceKm || 50;
    const distScore = Math.max(0, 1 - dist / maxDist);
    if (dist < 5) reasons.push(`Very close (${dist.toFixed(1)} km)`);
    else if (dist < 15) reasons.push(`Nearby (${dist.toFixed(1)} km)`);

    // Price fairness (0-1, cheaper = higher)
    const priceRatio = listing.pricePerUnit / (avgPrice || 1);
    const priceScore = Math.max(0, Math.min(1, 2 - priceRatio));
    if (priceRatio < 0.9) reasons.push('Below average liquidation price');
    else if (priceRatio <= 1.1) reasons.push('Fair market pricing');

    // Urgency score
    const urgencyMap: Record<string, number> = { high: 1, medium: 0.6, low: 0.3 };
    const urgencyScore = urgencyMap[listing.urgency] || 0.3;
    if (listing.urgency === 'high') reasons.push('Urgent clearance sale');

    // Expiry score (closer expiry = higher priority to move)
    let expiryScore = 0.5;
    if (listing.expiryDate) {
      const daysToExpiry = (new Date(listing.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToExpiry <= 0) expiryScore = 0;
      else if (daysToExpiry <= 3) { expiryScore = 1; reasons.push('Expiring very soon'); }
      else if (daysToExpiry <= 7) { expiryScore = 0.8; reasons.push('Expiring this week'); }
      else expiryScore = Math.max(0.2, 1 - daysToExpiry / 30);
    }

    // Seller rating score
    const ratingScore = (listing.seller.rating || 5) / 5;
    if (listing.seller.rating >= 4) reasons.push('High merchant trust score');

    const totalScore =
      0.30 * distScore +
      0.25 * priceScore +
      0.15 * urgencyScore +
      0.15 * expiryScore +
      0.15 * ratingScore;

    return {
      ...listing,
      matchScore: Math.round(totalScore * 100),
      distanceKm: Math.round(dist * 10) / 10,
      reasons,
    };
  });

  // Filter by maxDistance if specified
  const filtered = input.maxDistanceKm
    ? scored.filter((item) => item.distanceKm <= input.maxDistanceKm!)
    : scored;

  filtered.sort((a, b) => b.matchScore - a.matchScore);
  return filtered;
}
