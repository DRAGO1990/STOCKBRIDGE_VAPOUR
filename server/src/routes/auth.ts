import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { config } from '../config';
import { registerSchema, loginSchema } from '../validators';
import { authMiddleware, AuthPayload } from '../middleware/auth';

const router = Router();

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone || '',
        businessName: data.businessName || '',
        lat: data.lat || 0,
        lng: data.lng || 0,
        address: data.address || '',
      },
    });
    const payload: AuthPayload = { userId: user.id, email: user.email, isAdmin: user.isAdmin };
    const tokens = generateTokens(payload);
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, businessName: user.businessName, isAdmin: user.isAdmin },
      ...tokens,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.active) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const payload: AuthPayload = { userId: user.id, email: user.email, isAdmin: user.isAdmin };
    const tokens = generateTokens(payload);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, businessName: user.businessName, isAdmin: user.isAdmin },
      ...tokens,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    const payload: AuthPayload = { userId: user.id, email: user.email, isAdmin: user.isAdmin };
    const tokens = generateTokens(payload);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Current user
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, name: true, email: true, phone: true, businessName: true,
        lat: true, lng: true, address: true, rating: true, verified: true,
        isAdmin: true, createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, phone, businessName, lat, lng, address } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(businessName !== undefined && { businessName }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        ...(address !== undefined && { address }),
      },
      select: {
        id: true, name: true, email: true, phone: true, businessName: true,
        lat: true, lng: true, address: true, rating: true, verified: true, isAdmin: true,
      },
    });
    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
