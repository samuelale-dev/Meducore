import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-fallback-secret-change-this-in-production-environments';

router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      return res.status(400).json({ error: 'Email, password, and tenantId are required' });
    }

    // 1. Locate User using the correct compound unique key constraint from your schema
    let user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email
        }
      }
    });

    // 2. Bootstrap Administration System
    // NOTE: Since your schema does not have a 'password' field, we store the hash in 'authId' 
    // as a temporary workaround so your local bcrypt logic continues to function.
    const globalUserCount = await prisma.user.count();
    if (globalUserCount === 0 && email === 'admin@educore.edu') {
      const hashedBootstrapPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: 'admin@educore.edu',
          fullName: 'System Administrator',
          authId: hashedBootstrapPassword, // Temporary placeholder for the hash since 'password' doesn't exist
          role: 'ADMIN',
          tenantId: tenantId
        }
      });
    }

    if (!user || !user.authId) {
      return res.status(401).json({ error: 'Invalid email, password, or tenant credentials' });
    }

    // 3. Compare password against the string stored in authId
    const match = await bcrypt.compare(password, user.authId);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email, password, or tenant credentials' });
    }

    // 4. Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
