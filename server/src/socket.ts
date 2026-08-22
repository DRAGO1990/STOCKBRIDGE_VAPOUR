import { Server as IOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config';
import prisma from './lib/prisma';
import { AuthPayload } from './middleware/auth';

const userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

export function setupSocket(httpServer: HTTPServer) {
  const io = new IOServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    console.log(`Socket connected: ${user.email} (${socket.id})`);

    // Track user sockets
    if (!userSockets.has(user.userId)) {
      userSockets.set(user.userId, new Set());
    }
    userSockets.get(user.userId)!.add(socket.id);

    // Join reservation rooms
    socket.on('join-reservation', async (reservationId: string) => {
      try {
        const reservation = await prisma.reservation.findUnique({
          where: { id: reservationId },
          include: { listing: true },
        });
        if (!reservation) return;
        if (reservation.buyerId !== user.userId && reservation.listing.sellerId !== user.userId) return;
        socket.join(`reservation:${reservationId}`);
      } catch (err) {
        console.error('Join reservation error:', err);
      }
    });

    socket.on('leave-reservation', (reservationId: string) => {
      socket.leave(`reservation:${reservationId}`);
    });

    // Send message
    socket.on('send-message', async (data: { reservationId: string; text: string }) => {
      try {
        const reservation = await prisma.reservation.findUnique({
          where: { id: data.reservationId },
          include: { listing: true },
        });
        if (!reservation) return;
        if (reservation.buyerId !== user.userId && reservation.listing.sellerId !== user.userId) return;

        const message = await prisma.message.create({
          data: {
            reservationId: data.reservationId,
            senderId: user.userId,
            text: data.text,
          },
          include: { sender: { select: { id: true, name: true } } },
        });

        // Broadcast to reservation room
        io.to(`reservation:${data.reservationId}`).emit('new-message', message);

        // Notify counterparty
        const counterpartyId = reservation.buyerId === user.userId
          ? reservation.listing.sellerId
          : reservation.buyerId;

        const counterpartySockets = userSockets.get(counterpartyId);
        if (counterpartySockets) {
          counterpartySockets.forEach(socketId => {
            io.to(socketId).emit('notification', {
              type: 'message',
              reservationId: data.reservationId,
              from: user.email,
              preview: data.text.substring(0, 50),
            });
          });
        }
      } catch (err) {
        console.error('Send message error:', err);
      }
    });

    // Reservation status change notification
    socket.on('reservation-update', async (data: { reservationId: string; status: string }) => {
      io.to(`reservation:${data.reservationId}`).emit('reservation-status', {
        reservationId: data.reservationId,
        status: data.status,
      });
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(user.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(user.userId);
      }
    });
  });

  return io;
}
