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
import voiceRoutes from './routes/voice';
import notificationRoutes from './routes/notifications';
import inventoryRoutes from './routes/inventory';
import invoiceRoutes from './routes/invoices';
import { runAutoExpiryUnlistingCheck } from './services/expiryMonitor';

const app = express();
const server = http.createServer(app);

// Socket.io
setupSocket(server);

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        !config.clientUrl ||
        config.clientUrl === '*' ||
        origin === config.clientUrl ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(morgan('short'));
app.use(express.json());
app.use(cookieParser());

// Static files for public product images only (Invoices remain private and protected)
app.use('/uploads/products', express.static(path.resolve(config.upload.dir, 'products')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production SPA static serving (Serves React Vite build for all web pages)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/socket.io')
  ) {
    return next();
  }
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) next();
  });
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

// AdityaRana: Automatic expiry unlisting background monitor
runAutoExpiryUnlistingCheck().catch((err) =>
  console.error('[ExpiryMonitor] Startup check error:', err)
);

const EXPIRY_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
setInterval(() => {
  runAutoExpiryUnlistingCheck().catch((err) =>
    console.error('[ExpiryMonitor] Periodic check error:', err)
  );
}, EXPIRY_CHECK_INTERVAL_MS);

server.listen(config.port, () => {
  console.log(`🚀 StockBridge server running on port ${config.port}`);
});

export default app;
