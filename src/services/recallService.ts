import createHttpError from 'http-errors';
import { ulid } from 'ulid';
import { RecallModel, RecallDocument } from '../models/Recall';
import { RecallStatus, ObligationStatus } from '../types/enums';
import { sendMessage } from '../kafka/producer';
import { Topics } from '../kafka/topics';
import type { InitiateRecallInput } from '../validation/schemas';

export async function initiateRecall(input: InitiateRecallInput): Promise<RecallDocument> {
  const recallId = ulid();
  const totalQuantityDistributed = input.distributors.reduce((sum, d) => sum + d.quantityDistributed, 0);
  const doc = await RecallModel.create({
    recallId,
    productName: input.productName,
    batchId: input.batchId,
    reason: input.reason,
    initiatedBy: input.initiatedBy,
    initiatedAt: new Date(),
    status: RecallStatus.RECALL_INITIATED,
    distributors: input.distributors.map(d => ({
      distributorId: d.distributorId,
      distributorName: d.distributorName,
      contactEmail: d.contactEmail,
      quantityDistributed: d.quantityDistributed,
      quantityReturned: 0,
      status: ObligationStatus.PENDING,
    })),
    totalQuantityDistributed,
    totalQuantityReturned: 0,
    auditTrail: [
      { at: new Date(), actor: input.initiatedBy, action: 'INITIATE_RECALL', details: { recallId } },
    ],
  });

  await sendMessage(Topics.RECALL_INITIATED, recallId, { recallId });
  return doc;
}

export async function markNotificationsSent(recallId: string, actor: string): Promise<RecallDocument> {
  const recall = await RecallModel.findOne({ recallId });
  if (!recall) throw createHttpError(404, 'Recall not found');
  if (recall.status !== RecallStatus.RECALL_INITIATED) {
    throw createHttpError(409, `Invalid state transition from ${recall.status}`);
  }
  recall.status = RecallStatus.NOTIFICATIONS_SENT;
  recall.auditTrail.push({ at: new Date(), actor, action: 'SEND_NOTIFICATIONS' });
  await recall.save();

  await sendMessage(Topics.NOTIFICATIONS_SENT, recallId, { recallId });
  return recall;
}

export async function acknowledgeDistributor(recallId: string, distributorId: string, actor: string): Promise<RecallDocument> {
  const recall = await RecallModel.findOne({ recallId });
  if (!recall) throw createHttpError(404, 'Recall not found');
  const obligation = recall.distributors.find(d => d.distributorId === distributorId);
  if (!obligation) throw createHttpError(404, 'Distributor not part of recall');
  if (obligation.status !== ObligationStatus.PENDING) {
    throw createHttpError(409, `Distributor already ${obligation.status}`);
  }
  obligation.status = ObligationStatus.ACKNOWLEDGED;
  obligation.acknowledgmentAt = new Date();
  recall.auditTrail.push({ at: new Date(), actor, action: 'ACKNOWLEDGE', details: { distributorId } });

  // If all acknowledged, move to RETURNS_IN_PROGRESS
  const allAck = recall.distributors.every(d => d.status === ObligationStatus.ACKNOWLEDGED || d.status === ObligationStatus.RETURNED);
  if (allAck) {
    recall.status = RecallStatus.RETURNS_IN_PROGRESS;
    recall.auditTrail.push({ at: new Date(), actor: 'system', action: 'ALL_ACKNOWLEDGED' });
  }

  await recall.save();

  if (allAck) {
    await sendMessage(Topics.RETURNS_IN_PROGRESS, recallId, { recallId });
  } else {
    await sendMessage(Topics.DISTRIBUTOR_ACKNOWLEDGED, recallId, { recallId, distributorId });
  }

  return recall;
}

export async function updateReturns(recallId: string, distributorId: string, quantityReturned: number, actor: string): Promise<RecallDocument> {
  const recall = await RecallModel.findOne({ recallId });
  if (!recall) throw createHttpError(404, 'Recall not found');
  const obligation = recall.distributors.find(d => d.distributorId === distributorId);
  if (!obligation) throw createHttpError(404, 'Distributor not part of recall');

  obligation.quantityReturned += quantityReturned;
  if (obligation.quantityReturned >= obligation.quantityDistributed) {
    obligation.quantityReturned = obligation.quantityDistributed;
    obligation.status = ObligationStatus.RETURNED;
    obligation.returnCompletedAt = new Date();
  }

  recall.totalQuantityReturned = recall.distributors.reduce((sum, d) => sum + d.quantityReturned, 0);

  recall.auditTrail.push({
    at: new Date(),
    actor,
    action: 'UPDATE_RETURN',
    details: { distributorId, quantityReturned },
  });

  await recall.save();

  await sendMessage(Topics.RETURNS_UPDATED, recallId, { recallId, distributorId });
  return recall;
}

export async function tryCloseRecall(recallId: string, actor: string): Promise<RecallDocument> {
  const recall = await RecallModel.findOne({ recallId });
  if (!recall) throw createHttpError(404, 'Recall not found');

  if (recall.totalQuantityReturned < recall.totalQuantityDistributed) {
    throw createHttpError(409, 'Cannot close: returns not complete');
  }

  recall.status = RecallStatus.RECALL_CLOSED;
  recall.auditTrail.push({ at: new Date(), actor, action: 'CLOSE_RECALL' });
  await recall.save();

  await sendMessage(Topics.RECALL_CLOSED, recallId, { recallId });
  return recall;
}

export async function getRecall(recallId: string): Promise<RecallDocument | null> {
  return RecallModel.findOne({ recallId });
}

export async function listRecalls(): Promise<RecallDocument[]> {
  return RecallModel.find().sort({ createdAt: -1 }).limit(100);
}
