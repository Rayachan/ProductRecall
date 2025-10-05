import { Router } from 'express';
import { z } from 'zod';
import { InitiateRecallSchema, AcknowledgeSchema, ReturnsUpdateSchema } from '../validation/schemas';
import { acknowledgeDistributor, getRecall, initiateRecall, listRecalls, markNotificationsSent, tryCloseRecall, updateReturns } from '../services/recallService';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const recalls = await listRecalls();
    res.json(recalls);
  } catch (err) { next(err); }
});

router.get('/:recallId', async (req, res, next) => {
  try {
    const recall = await getRecall(req.params.recallId);
    if (!recall) return res.status(404).json({ message: 'Not found' });
    res.json(recall);
  } catch (err) { next(err); }
});

router.post('/initiate', async (req, res, next) => {
  try {
    const input = InitiateRecallSchema.parse(req.body);
    const recall = await initiateRecall(input);
    res.status(201).json(recall);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.issues });
    next(err);
  }
});

router.post('/:recallId/notifications/sent', async (req, res, next) => {
  try {
    const recall = await markNotificationsSent(req.params.recallId, 'notifications-service');
    res.json(recall);
  } catch (err) { next(err); }
});

router.post('/:recallId/acknowledge', async (req, res, next) => {
  try {
    const input = AcknowledgeSchema.parse({ ...req.body, recallId: req.params.recallId });
    const recall = await acknowledgeDistributor(input.recallId, input.distributorId, 'distributor-portal');
    res.json(recall);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.issues });
    next(err);
  }
});

router.post('/:recallId/returns', async (req, res, next) => {
  try {
    const input = ReturnsUpdateSchema.parse({ ...req.body, recallId: req.params.recallId });
    const recall = await updateReturns(input.recallId, input.distributorId, input.quantityReturned, 'warehouse');
    res.json(recall);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.issues });
    next(err);
  }
});

router.post('/:recallId/close', async (req, res, next) => {
  try {
    const recall = await tryCloseRecall(req.params.recallId, 'recall-manager');
    res.json(recall);
  } catch (err) { next(err); }
});

export default router;
