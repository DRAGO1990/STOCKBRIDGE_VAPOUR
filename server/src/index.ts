import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import { config } from './config';
import { setupSocket } from './socket';
import prisma from './lib/prisma';

// Routes
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import reservationRoutes from './routes/reservations';
import ratingRoutes from './routes/ratings';
import messageRoutes from './routes/messages';
import adminRoutes from './routes/admin';

const app = express();
const server = http.createServer(app);

// Socket.io
setupSocket(server);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan('short'));
app.use(express.json());
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-expire pending reservations (run every minute)
setInterval(async () => {
  try {
    const expired = await prisma.reservation.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
    });
    for (const res of expired) {
      await prisma.reservation.update({
        where: { id: res.id },
        data: { status: 'cancelled' },
      });
      await prisma.listing.update({
        where: { id: res.listingId },
        data: { status: 'active' },
      });
      console.log(`Auto-expired reservation ${res.id}`);
    }
  } catch (err) {
    console.error('Auto-expire error:', err);
  }
}, 60000); // Every minute

server.listen(config.port, () => {
  console.log(`🚀 StockBridge server running on port ${config.port}`);
});

export default app;
