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

function maskDocumentNumber(type?: string | null, num?: string | null): string | null {
  if (!num) return null;
  const clean = num.replace(/\s+/g, '').toUpperCase();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  if (type === 'Aadhaar' || clean.length === 12) {
    return `•••• •••• ${last4}`;
  }
  return `••••••${last4}`;
}

function formatUserResponse(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    businessName: user.businessName || '',
    lat: user.lat ?? 0,
    lng: user.lng ?? 0,
    address: user.address || '',
    rating: user.rating ?? 0,
    verified: Boolean(user.verified),
    verificationStatus: user.verificationStatus || (user.verified ? 'verified' : 'pending'),
    idDocumentType: user.idDocumentType || null,
    idDocumentNumber: user.idDocumentNumber || null,
    isAdmin: Boolean(user.isAdmin),
    active: user.active !== false,
    createdAt: user.createdAt,
  };
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
    const maskedDoc = data.idDocumentNumber
      ? maskDocumentNumber(data.idDocumentType, data.idDocumentNumber)
      : null;

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
        idDocumentType: data.idDocumentType || null,
        idDocumentNumber: maskedDoc,
        verificationStatus: maskedDoc ? 'under_review' : 'pending',
        verified: false,
      },
    });

    const payload: AuthPayload = { userId: user.id, email: user.email, isAdmin: user.isAdmin };
    const tokens = generateTokens(payload);
    res.status(201).json({
      user: formatUserResponse(user),
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
      res.status(401).json({ error: 'Invalid credentials or inactive account' });
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
      user: formatUserResponse(user),
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

// Google OAuth Sign-In / Up
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, token, address, lat, lng } = req.body;
    const idToken = credential || token;

    if (!idToken) {
      res.status(400).json({ error: 'Google authentication requires a valid Google ID token credential.' });
      return;
    }

    let email: string | null = null;
    let name: string | null = null;

    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (verifyRes.ok) {
        const payload: any = await verifyRes.json();
        email = payload.email;
        name = payload.name || payload.given_name || email?.split('@')[0] || 'Merchant';
      } else {
        res.status(401).json({ error: 'Google OAuth token verification failed. The token may be expired or invalid.' });
        return;
      }
    } catch (tokenErr) {
      console.warn('Google token verification error:', tokenErr);
      res.status(502).json({ error: 'Failed to contact Google OAuth servers for verification.' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Could not extract email address from Google ID token.' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const dummyPassword = await bcrypt.hash(`google_${Math.random()}_${Date.now()}`, 10);
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          passwordHash: dummyPassword,
          businessName: `${name || 'Merchant'} Enterprises`,
          address: address || 'Bandra Kurla Complex, Mumbai (MH)',
          lat: typeof lat === 'number' ? lat : 19.076,
          lng: typeof lng === 'number' ? lng : 72.877,
          verified: true,
          verificationStatus: 'verified',
        },
      });
    }

    if (!user.active) {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
      return;
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, isAdmin: user.isAdmin };
    const tokens = generateTokens(payload);

    res.json({
      user: formatUserResponse(user),
      ...tokens,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
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
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(formatUserResponse(user));
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile & identity verification
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, phone, businessName, lat, lng, address, idDocumentType, idDocumentNumber } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (businessName !== undefined) dataToUpdate.businessName = businessName;
    if (lat !== undefined) dataToUpdate.lat = lat;
    if (lng !== undefined) dataToUpdate.lng = lng;
    if (address !== undefined) dataToUpdate.address = address;

    if (idDocumentType && idDocumentNumber) {
      dataToUpdate.idDocumentType = idDocumentType;
      dataToUpdate.idDocumentNumber = maskDocumentNumber(idDocumentType, idDocumentNumber);
      dataToUpdate.verificationStatus = 'under_review';
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: dataToUpdate,
    });
    res.json(formatUserResponse(user));
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
