// @ts-nocheck
// ============================================================
// EduCore: POST /api/onboarding/verify
// File: educore/client/api/onboarding/verify.ts
// Secure version - uses token email, not request body email
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { prisma } from '../_lib/prisma';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const token = authHeader.split(' ')[1];
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
  if (error || !supabaseUser) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Use email from verified token — NOT from request body (security fix)
  const verifiedEmail = supabaseUser.email;
  const { role, verificationId } = req.body;

  if (!role || !verificationId) {
    return res.status(400).json({ error: 'role and verificationId are required' });
  }

  try {
    let userRecord = null;

    if (role === 'STUDENT') {
      // Students verify by Student ID number
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

      // Find user by fullName only — check role in JS to avoid enum error
      const potentialUser = await prisma.user.findFirst({
        where: {
          fullName: student.fullName,
          tenantId: student.tenantId ?? undefined,
          authId: null,
        },
      });

      if (potentialUser && potentialUser.role === 'STUDENT') {
        userRecord = potentialUser;
      }

      if (!userRecord) {
        return res.status(404).json({
          error: `Student ID ${studentId} found but no user account exists. Ask an admin to provision you.`,
        });
      }

    } else {
      // Staff verify by their registered email
      const potentialUser = await prisma.user.findFirst({
        where: {
          email: verificationId.toLowerCase().trim(),
          authId: null,
        },
      });

      // Check role in JavaScript — avoids PostgreSQL enum type error
      if (potentialUser && potentialUser.role === role) {
        userRecord = potentialUser;
      }

      if (!userRecord) {
        return res.status(404).json({
          error: `No ${role.replace(/_/g, ' ').toLowerCase()} account found for "${verificationId}". Contact your administrator.`,
        });
      }
    }

    // Security: warn if emails differ (but still allow linking)
    if (userRecord.email.toLowerCase() !== verifiedEmail.toLowerCase()) {
      console.warn(`[Onboarding] Email mismatch: token=${verifiedEmail}, record=${userRecord.email}`);
    }

    // Link the Google account using VERIFIED email from token
    const linked = await prisma.user.update({
      where: { id: userRecord.id },
      data: {
        authId: supabaseUser.id,
        email: verifiedEmail, // update to verified email
      },
      select: { id: true, email: true, fullName: true, role: true, tenantId: true },
    });

    return res.json({
      message: 'Account verified and linked successfully',
      user: linked,
    });

  } catch (err) {
    console.error('[onboarding/verify] Error:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
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
