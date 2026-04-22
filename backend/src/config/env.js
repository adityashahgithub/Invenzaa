import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Always load backend/.env reliably (regardless of process.cwd()).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/invenzaa',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nearExpiryDays: parseInt(process.env.NEAR_EXPIRY_DAYS, 10) || 30,
  expiryAlertIntervalMs: parseInt(process.env.EXPIRY_ALERT_INTERVAL_MS, 10) || 24 * 60 * 60 * 1000,
  expiryAlertStartupDelayMs: parseInt(process.env.EXPIRY_ALERT_STARTUP_DELAY_MS, 10) || 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  logLevel: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  logFile: process.env.LOG_FILE,
  mail: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : undefined,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    secure: process.env.MAIL_SECURE === 'true',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};
