// ============================================================
// EduCore: GET|POST /api/tenant/users
// File: educore/client/api/tenant/users.ts
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthContext, handleCors, hasRole } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const ctx = await getAuthContext(req, res);
  if (!ctx) return;
  if (!hasRole(ctx, res, 'ADMIN')) return;

  // ── GET: list all users in this tenant ──
  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  }

  // ── POST: create a new user ──
  if (req.method === 'POST') {
    const { email, fullName, role } = req.body as {
      email: string;
      fullName: string;
      role: UserRole;
    };

    if (!email || !fullName || !role) {
      return res.status(400).json({ error: 'email, fullName, and role are required' });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` });
    }

    try {
      const newUser = await prisma.user.create({
        data: { tenantId: ctx.tenantId, email, fullName, role },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      });
      return res.status(201).json(newUser);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'A user with this email already exists in this tenant' });
      }
      throw err;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
