import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { reservationSchema } from '../validators';
import { config } from '../config';
import path from 'path';
import multer from 'multer';
import fs from 'fs';

const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: config.upload.maxSize } });

const router = Router();

// Create reservation
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = reservationSchema.parse(req.body);

    // Check listing exists and is active
    const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });
    if (!listing || listing.status !== 'active' || !listing.active) {
      res.status(400).json({ error: 'Listing not available' });
      return;
    }

    // Prevent self-reservation
    if (listing.sellerId === req.user!.userId) {
      res.status(400).json({ error: 'Cannot reserve your own listing' });
      return;
    }

    // Prevent double booking — check for pending/confirmed reservation on same listing
    const existingRes = await prisma.reservation.findFirst({
      where: {
        listingId: data.listingId,
        status: { in: ['pending', 'confirmed'] },
      },
    });
    if (existingRes) {
      res.status(400).json({ error: 'Listing already has an active reservation' });
      return;
    }

    const expiresAt = new Date(Date.now() + config.reservation.expiryMinutes * 60 * 1000);

    const reservation = await prisma.reservation.create({
      data: {
        listingId: data.listingId,
        buyerId: req.user!.userId,
        agreedPrice: data.agreedPrice,
        agreedQty: data.agreedQty,
        expiresAt,
      },
    });

    // Update listing status
    await prisma.listing.update({
      where: { id: data.listingId },
      data: { status: 'reserved' },
    });

    res.status(201).json(reservation);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Reserve error:', err);
    res.status(500).json({ error: 'Reservation failed' });
  }
});

// Get my reservations (as buyer)
router.get('/my/buying', authMiddleware, async (req: Request, res: Response) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { buyerId: req.user!.userId },
      include: {
        listing: {
          include: { seller: { select: { id: true, name: true, businessName: true, rating: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reservations);
  } catch (err) {
    console.error('My buying error:', err);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Get my reservations (as seller)
router.get('/my/selling', authMiddleware, async (req: Request, res: Response) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { listing: { sellerId: req.user!.userId } },
      include: {
        listing: true,
        buyer: { select: { id: true, name: true, businessName: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reservations);
  } catch (err) {
    console.error('My selling error:', err);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Get reservation by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const reservation = (await prisma.reservation.findUnique({
      where: { id },
      include: {
        listing: {
          include: { seller: { select: { id: true, name: true, businessName: true, rating: true, lat: true, lng: true } } },
        },
        buyer: { select: { id: true, name: true, businessName: true, rating: true } },
        messages: {
          include: { sender: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        ratings: true,
      },
    })) as any;
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    // Only buyer or seller can view
    if (reservation.buyerId !== req.user!.userId && reservation.listing.sellerId !== req.user!.userId && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    res.json(reservation);
  } catch (err) {
    console.error('Reservation detail error:', err);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Confirm reservation (seller only)
router.post('/:id/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const reservation = (await prisma.reservation.findUnique({
      where: { id },
      include: { listing: true },
    })) as any;
    if (!reservation || reservation.listing.sellerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (reservation.status !== 'pending') {
      res.status(400).json({ error: 'Can only confirm pending reservations' });
      return;
    }
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'confirmed' },
    });
    res.json(updated);
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: 'Confirmation failed' });
  }
});

// Cancel reservation
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const reservation = (await prisma.reservation.findUnique({
      where: { id },
      include: { listing: true },
    })) as any;
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    if (reservation.buyerId !== req.user!.userId && reservation.listing.sellerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (reservation.status === 'completed' || reservation.status === 'cancelled') {
      res.status(400).json({ error: 'Cannot cancel this reservation' });
      return;
    }
    await prisma.reservation.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    // Revert listing status
    await prisma.listing.update({
      where: { id: reservation.listingId },
      data: { status: 'active' },
    });
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Cancellation failed' });
  }
});

// Complete reservation with proof photo
router.post('/:id/complete', authMiddleware, upload.single('proof'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const reservation = (await prisma.reservation.findUnique({
      where: { id },
      include: { listing: true },
    })) as any;
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    if (reservation.buyerId !== req.user!.userId && reservation.listing.sellerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (reservation.status !== 'confirmed') {
      res.status(400).json({ error: 'Can only complete confirmed reservations' });
      return;
    }

    const proofPhoto = req.file ? `/uploads/${req.file.filename}` : null;

    await prisma.reservation.update({
      where: { id },
      data: { status: 'completed', proofPhoto },
    });

    // Mark listing as sold
    await prisma.listing.update({
      where: { id: reservation.listingId },
      data: { status: 'sold' },
    });

    res.json({ message: 'Transaction completed' });
  } catch (err) {
    console.error('Complete error:', err);
    res.status(500).json({ error: 'Completion failed' });
  }
});

export default router;
