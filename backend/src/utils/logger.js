import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const entries = Object.entries(meta || {}).filter(([, value]) => value !== undefined);
  const metaText = entries.length > 0 ? ` ${JSON.stringify(Object.fromEntries(entries))}` : '';
  return `${ts} [${level}]: ${message}${metaText}`;
});

export const logger = winston.createLogger({
  level: env.logLevel || (env.nodeEnv === 'production' ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

if (env.nodeEnv === 'production' && env.logFile) {
  logger.add(
    new winston.transports.File({ filename: env.logFile, level: 'error' })
  );
}
