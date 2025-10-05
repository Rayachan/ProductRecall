import { Kafka, KafkaConfig, logLevel } from 'kafkajs';
import { env } from '../config/env';

let kafkaSingleton: Kafka | null = null;

export function getKafka(): Kafka {
  if (!env.kafkaEnabled) {
    throw new Error('Kafka is disabled via KAFKA_ENABLED=false');
  }
  if (kafkaSingleton) return kafkaSingleton;
  const config: KafkaConfig = {
    clientId: env.kafkaClientId,
    brokers: env.kafkaBrokers,
    logLevel: logLevel.INFO,
    ssl: env.kafkaSsl ? true : undefined,
    sasl: env.kafkaSsl && env.kafkaSaslUsername && env.kafkaSaslPassword ? {
      mechanism: env.kafkaSaslMechanism,
      username: env.kafkaSaslUsername,
      password: env.kafkaSaslPassword,
    } : undefined,
  };
  kafkaSingleton = new Kafka(config);
  return kafkaSingleton;
}
