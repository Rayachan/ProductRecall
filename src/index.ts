import express from 'express';
import { env } from './config/env';
import { connectMongo } from './config/db';
import recallRouter from './routes/recall';
import { errorHandler, notFoundHandler } from './middleware/error';
import { getProducer } from './kafka/producer';
import { startConsumers } from './kafka/consumers';

async function bootstrap() {
  await connectMongo();
  await getProducer();
  await startConsumers();

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/recalls', recallRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`Guardian listening on port ${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
