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
  expiryDate?: string | null;
  urgency: 'low' | 'medium' | 'high';
  status: 'active' | 'reserved' | 'sold' | 'expired';
  active: boolean;
  imageUrl?: string | null;
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
