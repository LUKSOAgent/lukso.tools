import 'dotenv/config';
import { Indexer } from './indexer';
import { logger } from './logger';

const indexer = new Indexer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await indexer.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await indexer.stop();
  process.exit(0);
});

// Start indexer
indexer.start().catch((error) => {
  logger.error('Failed to start indexer:', error);
  process.exit(1);
});
