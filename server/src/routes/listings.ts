import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { listingSchema, listingUpdateSchema, matchQuerySchema } from '../validators';
import { matchListings } from '../services/matchingEngine';
import { resolveProductImage } from '../lib/productImages';
import { haversineDistance } from '../lib/haversine';
import { findLocationByName } from '../config/locations';

const router = Router();

// Get all active listings with backend location & radius filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, urgency, sort, lat, lng, radiusKm, city, page = '1', limit = '100' } = req.query;
    const where: any = { status: 'active', active: true };
    if (category && category !== 'all' && category !== 'All Categories') {
      where.category = category as string;
    }
    if (urgency && urgency !== 'all') {
      where.urgency = urgency as string;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { category: { contains: search as string } },
      ];
    }

    let listings = await prisma.listing.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, businessName: true, rating: true, lat: true, lng: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve target coordinates (from lat/lng params or city name)
    let targetLat: number | null = null;
    let targetLng: number | null = null;
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      targetLat = Number(lat);
      targetLng = Number(lng);
    } else if (city) {
      const loc = findLocationByName(city as string);
      if (loc) {
        targetLat = loc.lat;
        targetLng = loc.lng;
      }
    }

    // Backend location calculation & proximity filtering
    if (targetLat !== null && targetLng !== null) {
      listings = listings.map(l => {
        if (l.seller && typeof l.seller.lat === 'number' && typeof l.seller.lng === 'number') {
          const rawDist = haversineDistance(targetLat!, targetLng!, l.seller.lat, l.seller.lng);
          const distanceKm = Math.round(rawDist * 10) / 10;
          return { ...l, distanceKm };
        }
        return l;
      });

      // Filter by radius if finite radius is specified (100km or higher implies "All Distances")
      if (radiusKm !== undefined) {
        const rad = Number(radiusKm);
        if (!isNaN(rad) && rad < 100) {
          listings = listings.filter((l: any) => typeof l.distanceKm === 'number' && l.distanceKm <= rad);
        }
      }
    }

    // Backend sorting
    if (sort === 'nearest' && targetLat !== null) {
      listings.sort((a: any, b: any) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else if (sort === 'price_asc') {
      listings.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    } else if (sort === 'price_desc') {
      listings.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    } else if (sort === 'expiry') {
      listings.sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
    }

    const total = listings.length;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const paginated = listings.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      listings: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('Listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get listing by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { lat, lng } = req.query;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, businessName: true, rating: true, lat: true, lng: true, address: true } },
      },
    });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    let enriched: any = listing;
    if (lat && lng && listing.seller) {
      const d = haversineDistance(Number(lat), Number(lng), listing.seller.lat, listing.seller.lng);
      enriched = { ...listing, distanceKm: Math.round(d * 10) / 10 };
    }

    res.json(enriched);
  } catch (err) {
    console.error('Listing detail error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Get my listings
router.get('/my/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reservations: true } },
      },
    });
    res.json(listings);
  } catch (err) {
    console.error('My listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Create listing
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = listingSchema.parse(req.body);
    const imageUrl = data.imageUrl || resolveProductImage(data.title, data.category);
    const listing = await prisma.listing.create({
      data: {
        ...data,
        imageUrl,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        sellerId: req.user!.userId,
      },
    });
    res.status(201).json(listing);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.sellerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    const data = listingUpdateSchema.parse(req.body);
    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...data,
        ...(data.expiryDate !== undefined && { expiryDate: data.expiryDate ? new Date(data.expiryDate) : null }),
      },
    });
    res.json(updated);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Delete/deactivate listing
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || (listing.sellerId !== req.user!.userId && !req.user!.isAdmin)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.listing.update({
      where: { id },
      data: { active: false, status: 'expired' },
    });
    res.json({ message: 'Listing deactivated' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Match listings
router.post('/match', async (req: Request, res: Response) => {
  try {
    const data = matchQuerySchema.parse(req.body);
    const results = await matchListings(data);
    res.json(results);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Match error:', err);
    res.status(500).json({ error: 'Matching failed' });
  }
});

// Get categories
router.get('/meta/categories', async (_req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'active', active: true },
      select: { category: true },
      distinct: ['category'],
    });
    res.json(listings.map(l => l.category));
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

export default router;
