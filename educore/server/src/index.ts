import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Diagnostic Health Monitoring Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Direct Application Feature Router Integration
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

app.listen(PORT, () => {
  console.log(`EduCore Kernel operational on port execution context: ${PORT}`);
});
