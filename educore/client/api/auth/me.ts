// ============================================================
// EduCore: GET /api/auth/me
// File: educore/client/api/auth/me.ts
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthContext, handleCors } from '../lib/auth';
import { prisma } from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await getAuthContext(req, res);
  if (!ctx) return;

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
                                                        }
