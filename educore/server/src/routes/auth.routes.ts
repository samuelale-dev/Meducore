// ============================================================
// EduCore Phase 1: Fixed Auth Routes
// File: educore/server/src/routes/auth.routes.ts
// ============================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns the current authenticated user's profile
// This replaces any old email/password bootstrap logic
// ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('[GET /auth/me]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
