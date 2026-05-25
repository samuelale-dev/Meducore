// ============================================================
// EduCore Phase 1: Tenant & User Management Routes
// File: educore/server/src/routes/tenant.routes.ts
// ============================================================

import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();


// ─────────────────────────────────────────────
// GET /api/tenant/me
// Returns the current user's tenant + profile
// ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { tenant: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    });
  } catch (err) {
    console.error('[GET /tenant/me]', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});


// ─────────────────────────────────────────────
// GET /api/tenant/users
// ADMIN only — list all users in this tenant
// ─────────────────────────────────────────────
router.get(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId: req.user.tenantId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(users);
    } catch (err) {
      console.error('[GET /tenant/users]', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);


// ─────────────────────────────────────────────
// POST /api/tenant/users
// ADMIN only — provision a new user in this tenant
// Body: { email, fullName, role }
// ─────────────────────────────────────────────
router.post(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { email, fullName, role } = req.body as {
        email: string;
        fullName: string;
        role: UserRole;
      };

      if (!email || !fullName || !role) {
        res.status(400).json({ error: 'email, fullName, and role are required' });
        return;
      }

      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(role)) {
        res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        return;
      }

      const newUser = await prisma.user.create({
        data: {
          tenantId: req.user.tenantId,
          email,
          fullName,
          role,
          // authId will be linked when this user first logs in via Google OAuth
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json(newUser);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        res.status(409).json({ error: 'A user with this email already exists in this tenant' });
        return;
      }
      console.error('[POST /tenant/users]', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);


// ─────────────────────────────────────────────
// PATCH /api/tenant/users/:id
// ADMIN only — update a user's role
// Body: { role }
// ─────────────────────────────────────────────
router.patch(
  '/users/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body as { role: UserRole };

      // Make sure target user belongs to same tenant
      const targetUser = await prisma.user.findFirst({
        where: { id, tenantId: req.user.tenantId },
      });

      if (!targetUser) {
        res.status(404).json({ error: 'User not found in this tenant' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, fullName: true, role: true },
      });

      res.json(updated);
    } catch (err) {
      console.error('[PATCH /tenant/users/:id]', err);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);


// ─────────────────────────────────────────────
// POST /api/tenant/auth/link
// Called on first login to link Supabase auth_id to provisioned user
// Body: { email } — authId comes from the verified JWT in requireAuth
// ─────────────────────────────────────────────
router.post('/auth/link', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    // Find an un-linked user record matching this email in any tenant
    const unlinkedUser = await prisma.user.findFirst({
      where: {
        email,
        authId: null,
      },
    });

    if (!unlinkedUser) {
      res.status(404).json({
        error: 'No pending account found for this email. Ask your admin to provision you first.',
      });
      return;
    }

    const linked = await prisma.user.update({
      where: { id: unlinkedUser.id },
      data: { authId: req.user.authId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
      },
    });

    res.json({ message: 'Account linked successfully', user: linked });
  } catch (err) {
    console.error('[POST /tenant/auth/link]', err);
    res.status(500).json({ error: 'Failed to link account' });
  }
});


export default router;
