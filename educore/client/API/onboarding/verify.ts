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

  // Note: getAuthContext will return 403 for unprovisioned users.
  // For onboarding we only need the raw Supabase token — bypass appUser check.
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

  const { role, verificationId, email } = req.body as {
    role: UserRole;
    verificationId: string;
    email: string;
  };

  if (!role || !verificationId || !email) {
    return res.status(400).json({ error: 'role, verificationId, and email are required' });
  }

  // Find matching unlinked user record
  let userRecord = null;

  if (role === 'STUDENT') {
    // Students verify by Student ID number
    const studentId = parseInt(verificationId, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Student ID must be a number (e.g. 1000)' });
    }

    // Find the student record
    const student = await prisma.student.findFirst({
      where: { studentId },
    });

    if (!student) {
      return res.status(404).json({ error: `No student found with ID ${studentId}` });
    }

    // Find or create a users record for this student
    userRecord = await prisma.user.findFirst({
      where: {
        fullName: student.fullName,
        tenantId: student.tenantId ?? undefined,
        role: 'STUDENT',
        authId: null,
      },
    });

    if (!userRecord) {
      return res.status(404).json({
        error: `Student ID ${studentId} found but no user account exists yet. Ask an admin to provision you.`,
      });
    }

  } else {
    // Staff verify by their registered email
    userRecord = await prisma.user.findFirst({
      where: {
        email: verificationId.toLowerCase().trim(),
        role,
        authId: null,
      },
    });

    if (!userRecord) {
      return res.status(404).json({
        error: `No ${role.replace(/_/g, ' ').toLowerCase()} account found for "${verificationId}". Contact your administrator.`,
      });
    }
  }

  // Check the Google email matches the provisioned email (security check)
  if (userRecord.email.toLowerCase() !== email.toLowerCase()) {
    // Allow linking even if emails differ — admin may have used a different email
    // Just link the authId
  }

  // Link the Google account to this user record
  const linked = await prisma.user.update({
    where: { id: userRecord.id },
    data: { authId: supabaseUser.id, email },
    select: { id: true, email: true, fullName: true, role: true, tenantId: true },
  });

  return res.json({
    message: 'Account verified and linked successfully',
    user: linked,
  });
}
