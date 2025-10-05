import { z } from 'zod';

export const InitiateRecallSchema = z.object({
  productName: z.string().min(1),
  batchId: z.string().min(1),
  reason: z.string().min(1),
  initiatedBy: z.string().min(1),
  distributors: z.array(z.object({
    distributorId: z.string().min(1),
    distributorName: z.string().min(1),
    contactEmail: z.string().email().optional(),
    quantityDistributed: z.number().int().nonnegative(),
  })).min(1),
});

export const AcknowledgeSchema = z.object({
  distributorId: z.string().min(1),
  recallId: z.string().min(1),
});

export const ReturnsUpdateSchema = z.object({
  recallId: z.string().min(1),
  distributorId: z.string().min(1),
  quantityReturned: z.number().int().nonnegative(),
});

export type InitiateRecallInput = z.infer<typeof InitiateRecallSchema>;
export type AcknowledgeInput = z.infer<typeof AcknowledgeSchema>;
export type ReturnsUpdateInput = z.infer<typeof ReturnsUpdateSchema>;
