import { EachMessagePayload } from 'kafkajs';
import { getKafka } from './kafka';
import { Topics } from './topics';
import { markNotificationsSent } from '../services/recallService';
import { env } from '../config/env';

async function handleRecallInitiated({ message }: EachMessagePayload) {
  const recallId = message.key?.toString() || '';
  // Simulate async notifications dispatch and then mark as sent
  await markNotificationsSent(recallId, 'notifications-worker');
}

export async function startConsumers() {
  if (!env.kafkaEnabled) {
    return; // no-op in local/test
  }
  const kafka = getKafka();

  const recallConsumer = kafka.consumer({ groupId: 'guardian-recall-workers' });
  await recallConsumer.connect();
  await recallConsumer.subscribe({ topic: Topics.RECALL_INITIATED, fromBeginning: false });
  await recallConsumer.run({
    eachMessage: async (payload) => {
      if (payload.topic === Topics.RECALL_INITIATED) await handleRecallInitiated(payload);
    },
  });
}
