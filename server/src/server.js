import mongoose from 'mongoose';
import { assertConfig, config } from './config.js';
import { createApp } from './app.js';
import { bootstrap } from './services/bootstrap.js';

async function main() {
  assertConfig();
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  await bootstrap();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Retain API listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
