// ============================================================
// EduCore: GET /api/students/[studentId]/qr
// File: educore/client/api/students/[studentId]/qr.ts
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthContext, handleCors } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import QRCode from 'qrcode';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await getAuthContext(req, res);
  if (!ctx) return;

  const studentId = parseInt(req.query.studentId as string, 10);
  if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid studentId' });

  const student = await prisma.student.findFirst({
    where: { studentId, tenantId: ctx.tenantId },
  });

  if (!student) return res.status(404).json({ error: 'Student not found' });

  const qrPayload = JSON.stringify({ studentId: student.studentId, tenantId: ctx.tenantId });
  const qrCode = await QRCode.toDataURL(qrPayload);

  res.json({ studentId: student.studentId, fullName: student.fullName, qrCode });
            }
