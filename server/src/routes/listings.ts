import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { listingSchema, listingUpdateSchema, matchQuerySchema } from '../validators';
import { matchListings } from '../services/matchingEngine';

const router = Router();

// Get all active listings (public browsing)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = { status: 'active', active: true };
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { category: { contains: search as string } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, businessName: true, rating: true, lat: true, lng: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.listing.count({ where }),
    ]);
    res.json({ listings, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err) {
    console.error('Listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get listing by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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
    res.json(listing);
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
    const listing = await prisma.listing.create({
      data: {
        ...data,
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
