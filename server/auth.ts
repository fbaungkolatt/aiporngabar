import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { User, AdminUser } from '../src/types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'bluewave-super-secret-key-2026';
const TOKEN_EXPIRY = '7d';

export interface AuthRequest extends Request {
  user?: User;
  admin?: AdminUser;
  ipHash?: string;
}

// Generate an anonymized IP hash
export function getIpHash(req: Request): string {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  return crypto.createHash('sha256').update(String(ip) + 'bluewave-salt').digest('hex').slice(0, 16);
}

// Rate Limiter Memory Map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(maxRequests = 10, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getIpHash(req);
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please slow down and try again shortly.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    record.count += 1;
    next();
  };
}

// Generate User JWT
export function signUserToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'user',
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Generate Admin JWT
export function signAdminToken(admin: AdminUser): string {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      type: 'admin',
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// User Authentication Middleware
export function requireUserAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in to access this feature.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'user') {
      res.status(403).json({ error: 'Invalid user authentication token.' });
      return;
    }

    const user = db.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        error: 'Your account has been suspended by administration.',
        reason: user.suspensionReason,
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
  }
}

// Optional User Auth
export function optionalUserAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type === 'user') {
        const user = db.findUserById(decoded.id);
        if (user && !user.isSuspended) {
          req.user = user;
        }
      }
    } catch {
      // ignore
    }
  }
  next();
}

// Admin Authentication Middleware
export function requireAdminAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authorization required. Access denied.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'admin') {
      res.status(403).json({ error: 'Access forbidden: Admin credentials required.' });
      return;
    }

    const admin = db.findAdminById(decoded.id);
    if (!admin) {
      res.status(401).json({ error: 'Admin account not found.' });
      return;
    }

    req.admin = admin;
    req.ipHash = getIpHash(req);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Admin session expired. Please sign in again.' });
  }
}
