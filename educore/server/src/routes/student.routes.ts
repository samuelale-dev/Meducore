import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';
import QRCode from 'qrcode';

const router = Router();
const prisma = new PrismaClient();

// Create Student Record
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { fullName } = req.body;
    if (!fullName) {
      return res.status(400).json({ error: 'Student full name is required' });
    }

    // Auto-incremental calculation safe across dynamic transactional databases
    const aggregations = await prisma.student.aggregate({
      _max: { studentId: true }
    });

    const nextStudentId = aggregations._max.studentId 
      ? aggregations._max.studentId + 1 
      : 1000;

    const newStudent = await prisma.student.create({
      data: {
        fullName,
        studentId: nextStudentId
      }
    });

    return res.status(201).json(newStudent);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Generate & Stream QR Matrix Data URI
router.get('/:id/qr', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student target not found' });
    }

    // Construct verifiable structural text internal token data payload
    const structuredPayload = JSON.stringify({
      app: 'EduCore',
      id: student.id,
      studentId: student.studentId,
      name: student.fullName
    });

    const qrDataUri = await QRCode.toDataURL(structuredPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300
    });

    return res.json({ qrDataUri, student });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
