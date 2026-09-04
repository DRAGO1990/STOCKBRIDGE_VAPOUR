import { z } from 'zod';
import { MIN_EXPIRY_DAYS } from './utils/urgency';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().optional().default(''),
  businessName: z.string().optional().default(''),
  lat: z.number().optional().default(0),
  lng: z.number().optional().default(0),
  address: z.string().optional().default(''),
  idDocumentType: z.enum(['PAN', 'Aadhaar']).optional(),
  idDocumentNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const baseListingSchema = z
  .object({
    title: z.string().min(2).max(200),
    category: z.string().min(1).max(100),
    quantity: z.coerce.number().positive(),
    unit: z.string().min(1).max(50),
    pricePerUnit: z.coerce.number().positive({ message: 'Selling price must be a positive number' }),
    originalMrp: z.coerce.number().positive({ message: 'Original MRP must be a positive number' }).optional(),
    mrp: z.coerce.number().positive({ message: 'Original MRP must be a positive number' }).optional(),
    invoiceVerificationId: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
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
        { message: 'This product cannot be listed because less than 11 days are remaining until expiry.' }
      ),
    urgency: z.enum(['low', 'medium', 'high']).optional().default('low'),
  })
  .refine(
    (data) => {
      const activeMrp = data.originalMrp ?? data.mrp;
      if (activeMrp !== undefined && activeMrp !== null) {
        return data.pricePerUnit <= activeMrp;
      }
      return true;
    },
    {
      message: 'Selling price should not be greater than the Original MRP.',
      path: ['pricePerUnit'],
    }
  );

export const listingSchema = baseListingSchema;

export const baseListingUpdateSchema = z
  .object({
    title: z.string().min(2).max(200),
    category: z.string().min(1).max(100),
    quantity: z.coerce.number().positive(),
    unit: z.string().min(1).max(50),
    pricePerUnit: z.coerce.number().positive({ message: 'Selling price must be a positive number' }),
    originalMrp: z.coerce.number().positive({ message: 'Original MRP must be a positive number' }).optional(),
    mrp: z.coerce.number().positive({ message: 'Original MRP must be a positive number' }).optional(),
    invoiceVerificationId: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    expiryDate: z
      .string()
      .min(1, 'Expiry date is required')
      .refine(
        (val) => {
          const expiry = new Date(val);
          if (isNaN(expiry.getTime())) return false;
          const minDate = new Date();
          minDate.setDate(minDate.getDate() + MIN_EXPIRY_DAYS);
          minDate.setHours(0, 0, 0, 0);
          return expiry.getTime() >= minDate.getTime();
        },
        { message: 'This product cannot be listed because less than 11 days are remaining until expiry.' }
      ),
    urgency: z.enum(['low', 'medium', 'high']).optional(),
  })
  .partial()
  .refine(
    (data) => {
      const activeMrp = data.originalMrp ?? data.mrp;
      if (activeMrp !== undefined && data.pricePerUnit !== undefined) {
        return data.pricePerUnit <= activeMrp;
      }
      return true;
    },
    {
      message: 'Selling price should not be greater than the Original MRP.',
      path: ['pricePerUnit'],
    }
  );

export const listingUpdateSchema = baseListingUpdateSchema;

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
  { code: 'hi-IN', name: 'Hindi / Hinglish', nativeName: 'हिन्दी / Hinglish' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (IN)' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
] as const;

const validLanguageCodes = SUPPORTED_VOICE_LANGUAGES.map((l) => l.code) as unknown as [string, ...string[]];

export const voiceParseSchema = z.object({
  transcript: z.string().min(2, 'Transcript is too short'),
  language: z.string().default('hi-IN'),
});

// AdityaRana: Smart Inventory Batch & Log Schemas
export const inventoryBatchSchema = z.object({
  productName: z.string().min(2, 'Product name is required').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  batchNumber: z.string().max(100).optional().nullable(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  currentQuantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1).max(50),
  mrp: z.coerce.number().positive().optional().nullable(),
  costPrice: z.coerce.number().positive().optional().nullable(),
});

export const inventoryBatchUpdateSchema = inventoryBatchSchema.partial();

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  soldQuantity: z.coerce.number().min(0, 'Sold quantity cannot be negative'),
  remainingQuantity: z.coerce.number().min(0, 'Remaining quantity cannot be negative'),
  restockedQuantity: z.coerce.number().min(0, 'Restocked quantity cannot be negative').optional().default(0),
});
