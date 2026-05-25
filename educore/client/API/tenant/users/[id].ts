// ============================================================
// EduCore: PATCH /api/tenant/users/[id]
// File: educore/client/api/tenant/users/[id].ts
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthContext, handleCors, hasRole } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { UserRole } from '@prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await getAuthContext(req, res);
  if (!ctx) return;
  if (!hasRole(ctx, res, 'ADMIN')) return;

  const { id } = req.query as { id: string };
  const { role } = req.body as { role: UserRole };

  const targetUser = await prisma.user.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!targetUser) return res.status(404).json({ error: 'User not found in this tenant' });

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, fullName: true, role: true },
  });

  res.json(updated);
}
