import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { ratingSchema } from '../validators';

const router = Router();

// Create rating
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = ratingSchema.parse(req.body);

    // Check reservation exists and is completed
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: { listing: true },
    });
    if (!reservation || reservation.status !== 'completed') {
      res.status(400).json({ error: 'Can only rate completed transactions' });
      return;
    }

    // Verify user is buyer or seller
    const isBuyer = reservation.buyerId === req.user!.userId;
    const isSeller = reservation.listing.sellerId === req.user!.userId;
    if (!isBuyer && !isSeller) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // Verify target user is the counterparty
    if (isBuyer && data.toUserId !== reservation.listing.sellerId) {
      res.status(400).json({ error: 'Invalid rating target' });
      return;
    }
    if (isSeller && data.toUserId !== reservation.buyerId) {
      res.status(400).json({ error: 'Invalid rating target' });
      return;
    }

    // Check for duplicate rating
    const existing = await prisma.rating.findUnique({
      where: { fromUserId_reservationId: { fromUserId: req.user!.userId, reservationId: data.reservationId } },
    });
    if (existing) {
      res.status(400).json({ error: 'Already rated this transaction' });
      return;
    }

    const rating = await prisma.rating.create({
      data: {
        fromUserId: req.user!.userId,
        toUserId: data.toUserId,
        reservationId: data.reservationId,
        score: data.score,
        comment: data.comment || '',
      },
    });

    // Recalculate average rating
    const ratings = await prisma.rating.findMany({ where: { toUserId: data.toUserId } });
    const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    await prisma.user.update({
      where: { id: data.toUserId },
      data: { rating: Math.round(avgRating * 10) / 10 },
    });

    res.status(201).json(rating);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Rating error:', err);
    res.status(500).json({ error: 'Rating failed' });
  }
});

// Get ratings for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { select: { id: true, name: true, businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ratings);
  } catch (err) {
    console.error('User ratings error:', err);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

export default router;
