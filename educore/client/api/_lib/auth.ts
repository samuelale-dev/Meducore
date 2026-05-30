// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import { prisma } from './prisma';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function getAuthContext(req, res) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return null;
  }
  const { data: { user }, error } = await sb.auth.getUser(h.split(' ')[1]);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
  const u = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, tenantId: true, role: true, email: true }
  });
  if (!u) {
    res.status(403).json({ error: 'Not provisioned' });
    return null;
  }
  return { authId: user.id, email: u.email, tenantId: u.tenantId, role: u.role, userId: u.id };
}

export function hasRole(ctx, res, ...roles) {
  if (!roles.includes(ctx.role)) {
    res.status(403).json({ error: 'Access denied' });
    return false;
  }
  return true;
}

export function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
