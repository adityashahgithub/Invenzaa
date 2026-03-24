import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import purchasesRoutes from './routes/purchasesRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import rolesRoutes from './routes/rolesRoutes.js';
import masterRoutes from './routes/masterRoutes.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: env.nodeEnv === 'production',
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(
  cors({
    origin: env.clientUrl?.split(',').map((o) => o.trim()) || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

if (env.nodeEnv === 'production') {
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.rateLimitMax || 100,
    message: { success: false, message: 'Too many requests. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  }));
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.authRateLimitMax || 10,
    message: { success: false, message: 'Too many login attempts. Try again later.' },
    standardHeaders: true,
  }));
  app.use('/api/auth/register', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.authRateLimitMax || 10,
    message: { success: false, message: 'Too many login attempts. Try again later.' },
    standardHeaders: true,
  }));
}

app.use((req, res, next) => {
  req.logger = logger;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/masters', masterRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Invenzaa API is running' });
});

app.use(errorHandler);

export default app;
