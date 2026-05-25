import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-fallback-secret-change-this-in-production-environments';

router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Attempt to locate User
    let user = await prisma.user.findUnique({ where: { email } });

    // Bootstrap Administration System: If no users exist at all, auto-create the first account securely
    const globalUserCount = await prisma.user.count();
    if (globalUserCount === 0 && email === 'admin@educore.edu') {
      const hashedBootstrapPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: 'admin@educore.edu',
          password: hashedBootstrapPassword,
          role: 'ADMIN'
        }
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
