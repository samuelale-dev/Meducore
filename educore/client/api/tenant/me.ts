// ============================================================
// EduCore: GET /api/tenant/me
// File: educore/client/api/tenant/me.ts
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
    include: { tenant: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

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
    }
