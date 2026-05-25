// ============================================================
// EduCore Phase 1: Updated Express Entry Point
// File: educore/server/src/index.ts
// ADD the tenant route — keep everything else as-is
// ============================================================

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import tenantRoutes from './routes/tenant.routes'; // ← NEW

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tenant', tenantRoutes); // ← NEW

app.listen(PORT, () => {
  console.log(`EduCore server running on port ${PORT}`);
});

export default app;
