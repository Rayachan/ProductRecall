import { connectMongo } from '../config/db';
import { initiateRecall, markNotificationsSent, acknowledgeDistributor, updateReturns, tryCloseRecall, getRecall } from '../services/recallService';
import { RecallStatus } from '../types/enums';

async function main() {
  await connectMongo();

  const recall = await initiateRecall({
    productName: 'Organic Baby Spinach',
    batchId: 'FS-2025-Q3-B7',
    reason: 'Potential contamination',
    initiatedBy: 'qc_manager',
    distributors: [
      { distributorId: 'D1', distributorName: 'East Dist', quantityDistributed: 50 },
      { distributorId: 'D2', distributorName: 'West Dist', quantityDistributed: 50 },
    ],
  });

  console.log('Initiated recall:', recall.recallId, recall.status);

  await markNotificationsSent(recall.recallId, 'test');
  let afterNotify = await getRecall(recall.recallId);
  console.log('Notifications sent status:', afterNotify?.status);

  await acknowledgeDistributor(recall.recallId, 'D1', 'test');
  await acknowledgeDistributor(recall.recallId, 'D2', 'test');
  let afterAck = await getRecall(recall.recallId);
  console.log('After all ack status:', afterAck?.status);

  await updateReturns(recall.recallId, 'D1', 50, 'test');
  await updateReturns(recall.recallId, 'D2', 50, 'test');
  let afterReturns = await getRecall(recall.recallId);
  console.log('Totals:', afterReturns?.totalQuantityReturned, '/', afterReturns?.totalQuantityDistributed);

  const closed = await tryCloseRecall(recall.recallId, 'test');
  console.log('Final status:', closed.status);

  if (closed.status !== RecallStatus.RECALL_CLOSED) {
    throw new Error('Smoke test failed to close recall');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
