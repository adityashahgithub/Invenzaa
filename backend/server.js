import { connectDB } from './src/config/db.js';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { startNearExpiryAlertScheduler } from './src/services/expiryAlertService.js';
import { logger } from './src/utils/logger.js';

const bootstrap = async () => {
  await connectDB();
  startNearExpiryAlertScheduler();

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
  });
};

bootstrap();
