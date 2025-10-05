import { getKafka } from './kafka';
import type { Topic } from './topics';
import { env } from '../config/env';

let producerInstance: ReturnType<ReturnType<typeof getKafka>['producer']> | null = null;

export async function getProducer() {
  if (producerInstance) return producerInstance;
  const kafka = getKafka();
  producerInstance = kafka.producer();
  await producerInstance.connect();
  return producerInstance;
}

export async function sendMessage(topic: Topic, key: string, payload: unknown): Promise<void> {
  if (!env.kafkaEnabled) return;
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [
      {
        key,
        value: JSON.stringify(payload),
      },
    ],
  });
}
