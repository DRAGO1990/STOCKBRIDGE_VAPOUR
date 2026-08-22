import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().optional().default(''),
  businessName: z.string().optional().default(''),
  lat: z.number().optional().default(0),
  lng: z.number().optional().default(0),
  address: z.string().optional().default(''),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const listingSchema = z.object({
  title: z.string().min(2).max(200),
  category: z.string().min(1).max(100),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  pricePerUnit: z.number().positive(),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .refine(
      (val) => {
        const expiry = new Date(val);
        if (isNaN(expiry.getTime())) return false;
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 10);
        minDate.setHours(0, 0, 0, 0);
        return expiry.getTime() >= minDate.getTime();
      },
      { message: 'Expiry date must be at least 10 days in the future' }
    ),
  urgency: z.enum(['low', 'medium', 'high']).default('low'),
});

export const listingUpdateSchema = listingSchema.partial();

export const reservationSchema = z.object({
  listingId: z.string().uuid(),
  agreedPrice: z.number().positive(),
  agreedQty: z.number().positive(),
});

export const ratingSchema = z.object({
  reservationId: z.string().uuid(),
  toUserId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().default(''),
});

export const matchQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  quantity: z.number().positive().optional(),
  minQuantity: z.number().optional(),
  maxPricePerUnit: z.number().optional(),
  maxDistanceKm: z.number().optional(),
  lat: z.number().optional().default(19.076),
  lng: z.number().optional().default(72.877),
});

export const SUPPORTED_VOICE_LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
] as const;

const validLanguageCodes = SUPPORTED_VOICE_LANGUAGES.map((l) => l.code) as unknown as [string, ...string[]];

export const voiceParseSchema = z.object({
  transcript: z.string().min(3, 'Transcript is too short'),
  language: z.enum(validLanguageCodes),
});
