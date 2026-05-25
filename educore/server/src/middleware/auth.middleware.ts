// ============================================================
// EduCore Phase 1: Updated Auth Middleware
// File: educore/server/src/middleware/auth.middleware.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient, UserRole } from '@prisma/client';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const prisma = new PrismaClient();

// Extend Express Request with auth context
declare global {
  namespace Express {
    interface Request {
      user: {
        authId: string;
        email: string;
        tenantId: string;
        role: UserRole;
        userId: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or malformed authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // 1. Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // 2. Look up this user in our users table to get tenant + role
    const appUser = await prisma.user.findUnique({
      where: { authId: supabaseUser.id },
      select: {
        id: true,
        tenantId: true,
        role: true,
        email: true,
      },
    });

    if (!appUser) {
      res.status(403).json({
        error: 'User not provisioned. Contact your administrator.',
      });
      return;
    }

    // 3. Attach full context to request
    req.user = {
      authId: supabaseUser.id,
      email: appUser.email,
      tenantId: appUser.tenantId,
      role: appUser.role,
      userId: appUser.id,
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    res.status(500).json({ error: 'Internal authentication error' });
  }
}


// ─────────────────────────────────────────────
// Role guard factory — use after requireAuth
// Usage: router.post('/periods', requireAuth, requireRole('ADMIN'), handler)
// ─────────────────────────────────────────────

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}
