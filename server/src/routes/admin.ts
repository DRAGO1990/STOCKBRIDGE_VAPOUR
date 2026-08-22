import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// All routes require admin
router.use(authMiddleware, adminMiddleware);

// Get all users
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, businessName: true,
        rating: true, verified: true, active: true, isAdmin: true, createdAt: true,
        _count: { select: { listings: true, reservations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle user active status
router.post('/users/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { active: !user.active },
    });
    res.json({ id: updated.id, active: updated.active });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ error: 'Failed to toggle user' });
  }
});

// Get all listings (admin)
router.get('/listings', async (_req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings);
  } catch (err) {
    console.error('Admin listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Toggle listing active status
router.post('/listings/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    const updated = await prisma.listing.update({
      where: { id },
      data: { active: !listing.active, status: listing.active ? 'expired' : 'active' },
    });
    res.json({ id: updated.id, active: updated.active, status: updated.status });
  } catch (err) {
    console.error('Toggle listing error:', err);
    res.status(500).json({ error: 'Failed to toggle listing' });
  }
});

// Stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [users, listings, reservations, completed] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count({ where: { active: true } }),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'completed' } }),
    ]);
    res.json({ users, listings, reservations, completed });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
