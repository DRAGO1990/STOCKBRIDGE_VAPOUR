export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  lat?: number;
  lng?: number;
  address?: string;
  rating?: number;
  verified?: boolean;
  isAdmin?: boolean;
  active?: boolean;
  createdAt?: string;
  _count?: {
    listings?: number;
    reservations?: number;
  };
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description?: string | null;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  originalMrp?: number | null;
  mrp?: number | null;
  expiryDate?: string | null;
  urgency: 'low' | 'medium' | 'high';
  status: 'active' | 'reserved' | 'sold' | 'expired' | 'expiry_unlisted';
  active: boolean;
  imageUrl?: string | null;
  invoiceVerificationId?: string | null;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
  seller?: {
    id: string;
    name: string;
    businessName: string;
    rating: number;
    lat?: number;
    lng?: number;
    address?: string;
  };
  _count?: {
    reservations?: number;
  };
}

export interface Reservation {
  id: string;
  listingId: string;
  buyerId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  agreedPrice: number;
  agreedQty: number;
  proofPhoto?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  listing: Listing;
  buyer: {
    id: string;
    name: string;
    businessName: string;
    rating: number;
  };
  messages?: Message[];
  ratings?: Rating[];
}

export interface Message {
  id: string;
  reservationId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
}

export interface Rating {
  id: string;
  fromUserId: string;
  toUserId: string;
  reservationId: string;
  score: number;
  comment: string;
  createdAt: string;
  fromUser?: {
    id: string;
    name: string;
    businessName: string;
  };
}

export interface AdminStats {
  users: number;
  listings: number;
  reservations: number;
  completed: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  listingId?: string | null;
  inventoryBatchId?: string | null;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    imageUrl?: string | null;
    status: string;
    active: boolean;
  };
}

export type PredictionConfidence = 'insufficient' | 'low' | 'medium' | 'high';
export type InventoryRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InventoryPredictionResult {
  currentQuantity: number;
  unit: string;
  historyDaysCount: number;
  averageDailySales: number;
  daysUntilExpiry: number | null;
  daysUntilHighUrgency: number;
  predictedDaysToSellRemaining: number | null;
  predictedRemainingAtHighUrgency: number;
  recommendedListingQuantity: number;
  riskLevel: InventoryRiskLevel;
  confidence: PredictionConfidence;
  shouldRecommendListing: boolean;
  canListOnStockBridge: boolean;
  reason: string;
}

export interface DailyInventoryLog {
  id: string;
  inventoryBatchId: string;
  sellerId: string;
  date: string;
  soldQuantity: number;
  remainingQuantity: number;
  restockedQuantity: number;
  createdAt: string;
}

export interface InventoryBatch {
  id: string;
  sellerId: string;
  productName: string;
  category: string;
  batchNumber?: string | null;
  expiryDate: string;
  currentQuantity: number;
  unit: string;
  mrp?: number | null;
  costPrice?: number | null;
  createdAt: string;
  updatedAt: string;
  dailyLogs?: DailyInventoryLog[];
  prediction?: InventoryPredictionResult;
}

export interface InventorySummary {
  totalBatches: number;
  atRiskCount: number;
  highUrgencyCount: number;
  totalStockValueAtRisk: number;
}

export interface InvoiceCandidate {
  product: string;
  originalMrp: number;
}

export type InvoiceVerificationStatus =
  | 'VERIFIED'
  | 'LOW_CONFIDENCE'
  | 'MRP_NOT_FOUND'
  | 'MULTIPLE_MATCHES'
  | 'INVALID_INVOICE';

export interface InvoiceVerificationResponse {
  verificationId: string;
  status: InvoiceVerificationStatus;
  originalMrp: number | null;
  matchedProduct: string | null;
  candidates: InvoiceCandidate[];
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
  message: string;
}
