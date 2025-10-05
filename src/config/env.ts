import dotenv from 'dotenv';
dotenv.config();

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(getEnv('PORT', '3000'), 10),
  mongoUri: getEnv('MONGO_URI', 'mongodb://localhost:27017/guardian'),
  kafkaBrokers: getEnv('KAFKA_BROKERS', 'localhost:9093').split(',').map(s => s.trim()).filter(Boolean),
  kafkaClientId: getEnv('KAFKA_CLIENT_ID', 'guardian-service'),
  kafkaEnabled: (process.env.KAFKA_ENABLED ?? 'true').toLowerCase() !== 'false',
  mongoInMemory: (process.env.MONGO_INMEMORY ?? 'false').toLowerCase() === 'true',
};
