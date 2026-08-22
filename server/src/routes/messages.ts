import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get messages for a reservation
router.get('/reservation/:reservationId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const reservationId = req.params.reservationId as string;
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { listing: true },
    });
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    if (reservation.buyerId !== req.user!.userId && reservation.listing.sellerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { reservationId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        reservationId,
        senderId: { not: req.user!.userId },
        read: false,
      },
      data: { read: true },
    });

    res.json(messages);
  } catch (err) {
    console.error('Messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get unread count
router.get('/unread/count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const count = await prisma.message.count({
      where: {
        senderId: { not: req.user!.userId },
        read: false,
        reservation: {
          OR: [
            { buyerId: req.user!.userId },
            { listing: { sellerId: req.user!.userId } },
          ],
        },
      },
    });
    res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
