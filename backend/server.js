import { connectDB } from './src/config/db.js';
import app from './src/app.js';
import { env } from './src/config/env.js';

connectDB();

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
});
