// ============================================================
// EduCore: Auth Helper for Vercel API Functions
// File: educore/client/api/_lib/auth.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { prisma } from './prisma';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UserRole } from '@prisma/client';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface AuthContext {
  authId: string;
  email: string;
  tenantId: string;
  role: UserRole;
  userId: string;
}

// Verifies the Bearer token and returns the app user context.
// Returns null and sends a 401/403 response if verification fails.
export async function getAuthContext(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthContext | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed authorization header' });
    return null;
  }

  const token = authHeader.split(' ')[1];

  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

  if (error || !supabaseUser) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  const appUser = await prisma.user.findUnique({
    where: { authId: supabaseUser.id },
    select: { id: true, tenantId: true, role: true, email: true },
  });

  if (!appUser) {
    res.status(403).json({ error: 'User not provisioned. Contact your administrator.' });
    return null;
  }

  return {
    authId: supabaseUser.id,
    email: appUser.email,
    tenantId: appUser.tenantId,
    role: appUser.role,
    userId: appUser.id,
  };
}

// Role guard — call after getAuthContext
export function hasRole(ctx: AuthContext, res: VercelResponse, ...roles: UserRole[]): boolean {
  if (!roles.includes(ctx.role)) {
    res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    return false;
  }
  return true;
}

// CORS preflight handler — call at top of every function
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // caller should return early
  }
  return false;
  }
