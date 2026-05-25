// ============================================================
// EduCore Phase 1: Updated Student Routes (Tenant-Aware)
// File: educore/server/src/routes/student.routes.ts
// Replace your existing student.routes.ts with this file
// ============================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();


// ─────────────────────────────────────────────
// POST /api/students
// Create a student — ADMIN or HOMEROOM_TEACHER only
// Body: { fullName }
// ─────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'HOMEROOM_TEACHER'),
  async (req: Request, res: Response) => {
    try {
      const { fullName } = req.body as { fullName: string };

      if (!fullName?.trim()) {
        res.status(400).json({ error: 'fullName is required' });
        return;
      }

      // Get the highest studentId within this tenant, then increment
      const lastStudent = await prisma.student.findFirst({
        where: { tenantId: req.user.tenantId },
        orderBy: { studentId: 'desc' },
        select: { studentId: true },
      });

      const nextStudentId = lastStudent ? lastStudent.studentId + 1 : 1000;

      const student = await prisma.student.create({
        data: {
          studentId: nextStudentId,
          fullName: fullName.trim(),
          tenantId: req.user.tenantId,
        },
      });

      // Generate QR code containing studentId + tenantId for scan verification
      const qrPayload = JSON.stringify({
        studentId: student.studentId,
        tenantId: req.user.tenantId,
      });
      const qrCode = await QRCode.toDataURL(qrPayload);

      res.status(201).json({
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        qrCode,
      });
    } catch (err) {
      console.error('[POST /students]', err);
      res.status(500).json({ error: 'Failed to create student' });
    }
  }
);


// ─────────────────────────────────────────────
// GET /api/students
// List all students for this tenant
// All authenticated roles can read
// ─────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { studentId: 'asc' },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        createdAt: true,
      },
    });

    res.json(students);
  } catch (err) {
    console.error('[GET /students]', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});


// ─────────────────────────────────────────────
// GET /api/students/:studentId/qr
// Regenerate QR for a specific student
// ─────────────────────────────────────────────
router.get(
  '/:studentId/qr',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId, 10);

      if (isNaN(studentId)) {
        res.status(400).json({ error: 'Invalid studentId' });
        return;
      }

      const student = await prisma.student.findFirst({
        where: {
          studentId,
          tenantId: req.user.tenantId,
        },
      });

      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const qrPayload = JSON.stringify({
        studentId: student.studentId,
        tenantId: req.user.tenantId,
      });
      const qrCode = await QRCode.toDataURL(qrPayload);

      res.json({
        studentId: student.studentId,
        fullName: student.fullName,
        qrCode,
      });
    } catch (err) {
      console.error('[GET /students/:studentId/qr]', err);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  }
);


export default router;
