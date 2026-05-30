// ============================================================
// EduCore: POST /api/tenant/auth/link
// File: educore/client/api/tenant/auth/link.ts
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthContext, handleCors } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await getAuthContext(req, res);
  if (!ctx) return;

  const { email } = req.body as { email: string };
  if (!email) return res.status(400).json({ error: 'email is required' });

  const unlinkedUser = await prisma.user.findFirst({
    where: { email, authId: null },
  });

  if (!unlinkedUser) {
    return res.status(404).json({
      error: 'No pending account found for this email. Ask your admin to provision you first.',
    });
  }

  const linked = await prisma.user.update({
    where: { id: unlinkedUser.id },
    data: { authId: ctx.authId },
    select: { id: true, email: true, fullName: true, role: true, tenantId: true },
  });

  res.json({ message: 'Account linked successfully', user: linked });
}
