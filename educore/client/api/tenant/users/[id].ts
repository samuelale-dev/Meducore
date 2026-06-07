// ============================================================
// EduCore: GET /api/tenant/users/[id]
// File: api/tenant/users/[id].ts
// Returns full user profile + meal count for QR scanner
// ============================================================
// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../_lib/prisma';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: { user: su }, error } = await supabase.auth.getUser(token);
  if (error || !su) return res.status(401).json({ error: 'Invalid token' });

  // Caller must be ADMIN
  const caller = await prisma.user.findFirst({ where: { authId: su.id } });
  if (!caller || caller.role !== 'ADMIN') return res.status(403).json({ error: 'Admins only' });

  const { id } = req.query; // can be UUID or numeric studentId

  try {
    let user = null;

    // Try UUID lookup first
    if (id.length > 10 && id.includes('-')) {
      user = await prisma.user.findFirst({
        where: { id, tenantId: caller.tenantId },
      });
    }

    // Try numeric student ID lookup via Student table
    if (!user) {
      const studentId = parseInt(id, 10);
      if (!isNaN(studentId)) {
        const student = await prisma.student.findFirst({
          where: { studentId, tenantId: caller.tenantId },
        });
        if (student) {
          user = await prisma.user.findFirst({
            where: { fullName: student.fullName, tenantId: caller.tenantId },
          });
        }
      }
    }

    // Try email lookup
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: id.toLowerCase(), tenantId: caller.tenantId },
      });
    }

    if (!user) return res.status(404).json({ error: 'User not found in this tenant.' });

    // Meal count
    const mealsReceived = await prisma.mealRecord.count({
      where: { studentId: user.id, tenantId: caller.tenantId },
    });

    // Last active = latest meal served_at (best proxy we have)
    const lastMeal = await prisma.mealRecord.findFirst({
      where: { studentId: user.id },
      orderBy: { servedAt: 'desc' },
      select: { servedAt: true },
    });

    return res.json({
      id:           user.id,
      fullName:     user.fullName,
      email:        user.email,
      role:         user.role,
      createdAt:    user.createdAt,
      mealsReceived,
      lastActive:   lastMeal?.servedAt
        ? new Date(lastMeal.servedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
        : null,
    });

  } catch (err) {
    console.error('[tenant/users/[id]]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
