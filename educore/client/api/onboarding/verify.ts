// ============================================================
// EduCore: POST /api/onboarding/verify
// File: educore/client/api/onboarding/verify.ts
// Verifies a user's identity and links their Google account
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthContext, handleCors } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import type { UserRole } from '@prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  const token = authHeader.split(' ')[1];
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

  if (error || !supabaseUser) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const verifiedEmail = supabaseUser.email;
  if (!verifiedEmail) {
    return res.status(400).json({ error: 'Supabase token does not contain a verified email address' });
  }

  const { role, verificationId } = req.body as {
    role: UserRole;
    verificationId: string;
  };

  if (!role || !verificationId) {
    return res.status(400).json({ error: 'role and verificationId are required' });
  }

  let userRecord = null;

  if (role === 'STUDENT') {
    const studentId = parseInt(verificationId, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Student ID must be a number (e.g. 1000)' });
    }

    const student = await prisma.student.findFirst({
      where: { studentId },
    });

    if (!student) {
      return res.status(404).json({ error: `No student found with ID ${studentId}` });
    }

    // WORKAROUND: Remove 'role' from the where clause to prevent Postgres Enum crash
    const potentialUser = await prisma.user.findFirst({
      where: {
        fullName: student.fullName,
        tenantId: student.tenantId ?? undefined,
        authId: null,
      },
    });

    // Validate the role in-memory instead
    if (potentialUser && potentialUser.role === 'STUDENT') {
      userRecord = potentialUser;
    }

    if (!userRecord) {
      return res.status(404).json({
        error: `Student ID ${studentId} found but no user account exists yet. Ask an admin to provision you.`,
      });
    }

  } else {
    // WORKAROUND: Remove 'role' from the where clause to prevent Postgres Enum crash
    const potentialUser = await prisma.user.findFirst({
      where: {
        email: verificationId.toLowerCase().trim(),
        authId: null,
      },
    });

    // Validate the role in-memory instead
    if (potentialUser && potentialUser.role === role) {
      userRecord = potentialUser;
    }

    if (!userRecord) {
      return res.status(404).json({
        error: `No ${role.replace(/_/g, ' ').toLowerCase()} account found for "${verificationId}". Contact your administrator.`,
      });
    }
  }

  if (userRecord.email && userRecord.email.toLowerCase() !== verifiedEmail.toLowerCase()) {
    console.warn(`[Onboarding] Email mismatch for User ID ${userRecord.id}: Provisioned with ${userRecord.email}, but linked using ${verifiedEmail}`);
  }

  const linked = await prisma.user.update({
    where: { id: userRecord.id },
    data: { 
      authId: supabaseUser.id, 
      email: verifiedEmail.toLowerCase().trim() 
    },
    select: { id: true, email: true, fullName: true, role: true, tenantId: true },
  });

  return res.json({
    message: 'Account verified and linked successfully',
    user: linked,
  });
}
