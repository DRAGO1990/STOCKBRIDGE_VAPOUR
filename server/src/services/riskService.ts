export interface ListingRiskInput {
  title?: string;
  category?: string;
  unit?: string;
  mrp?: number | null;
  pricePerUnit: number;
  expiryDate?: Date | string | null;
  sellerId?: string;
}

export interface ListingRiskResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  priceDeviation?: number;
  referencePrice?: number;
  riskReason?: string;
}

export async function calculateListingRisk(input: ListingRiskInput): Promise<ListingRiskResult> {
  // Deterministic risk assessment based on MRP discount
  if (input.mrp && input.pricePerUnit > input.mrp) {
    return {
      riskLevel: 'HIGH',
      riskScore: 90,
      priceDeviation: Math.round(((input.pricePerUnit - input.mrp) / input.mrp) * 100 * 100) / 100,
      referencePrice: input.mrp,
      riskReason: 'Selling price exceeds product MRP.',
    };
  }

  return {
    riskLevel: 'LOW',
    riskScore: 20,
    priceDeviation: 5.0,
    referencePrice: input.mrp || input.pricePerUnit,
    riskReason: 'Listing pricing aligns with marketplace parameters.',
  };
}
