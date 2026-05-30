// ============================================================
// EduCore: GET|POST /api/students
// File: educore/client/api/students/index.ts
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthContext, handleCors, hasRole } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import QRCode from 'qrcode';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const ctx = await getAuthContext(req, res);
  if (!ctx) return;

  // ── GET: list all students in this tenant ──
  if (req.method === 'GET') {
    const students = await prisma.student.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { studentId: 'asc' },
      select: { id: true, studentId: true, fullName: true, createdAt: true },
    });
    return res.json(students);
  }

  // ── POST: create a new student ──
  if (req.method === 'POST') {
    if (!hasRole(ctx, res, 'ADMIN', 'HOMEROOM_TEACHER')) return;

    const { fullName } = req.body as { fullName: string };

    if (!fullName?.trim()) {
      return res.status(400).json({ error: 'fullName is required' });
    }

    const lastStudent = await prisma.student.findFirst({
      where: { tenantId: ctx.tenantId },
      orderBy: { studentId: 'desc' },
      select: { studentId: true },
    });

    const nextStudentId = lastStudent ? lastStudent.studentId + 1 : 1000;

    const student = await prisma.student.create({
      data: {
        studentId: nextStudentId,
        fullName: fullName.trim(),
        tenantId: ctx.tenantId,
      },
    });

    const qrPayload = JSON.stringify({ studentId: student.studentId, tenantId: ctx.tenantId });
    const qrCode = await QRCode.toDataURL(qrPayload);

    return res.status(201).json({
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      qrCode,
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
      }
