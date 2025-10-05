import mongoose, { Schema, Document, Types } from 'mongoose';
import { RecallStatus, ObligationStatus } from '../types/enums';

export interface DistributorObligation {
  distributorId: string;
  distributorName: string;
  contactEmail?: string;
  quantityDistributed: number;
  quantityReturned: number;
  status: ObligationStatus;
  acknowledgmentAt?: Date;
  returnCompletedAt?: Date;
}

export interface AuditEntry {
  at: Date;
  actor: string; // service or user identifier
  action: string; // e.g., INITIATE_RECALL, SEND_NOTIFICATIONS, ACKNOWLEDGE, CLOSE_RECALL
  details?: Record<string, unknown>;
}

export interface RecallDocument extends Document<Types.ObjectId> {
  recallId: string; // ULID for traceability
  productName: string;
  batchId: string;
  reason: string;
  initiatedBy: string;
  initiatedAt: Date;
  status: RecallStatus;
  distributors: DistributorObligation[];
  totalQuantityDistributed: number;
  totalQuantityReturned: number;
  auditTrail: AuditEntry[];
  updatedAt: Date;
  createdAt: Date;
}

const DistributorObligationSchema = new Schema<DistributorObligation>({
  distributorId: { type: String, required: true },
  distributorName: { type: String, required: true },
  contactEmail: { type: String },
  quantityDistributed: { type: Number, required: true, min: 0 },
  quantityReturned: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: Object.values(ObligationStatus), required: true, default: ObligationStatus.PENDING },
  acknowledgmentAt: { type: Date },
  returnCompletedAt: { type: Date },
}, { _id: false });

const AuditEntrySchema = new Schema<AuditEntry>({
  at: { type: Date, required: true },
  actor: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
}, { _id: false });

const RecallSchema = new Schema<RecallDocument>({
  recallId: { type: String, required: true, unique: true, index: true },
  productName: { type: String, required: true },
  batchId: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  initiatedBy: { type: String, required: true },
  initiatedAt: { type: Date, required: true },
  status: { type: String, enum: Object.values(RecallStatus), required: true },
  distributors: { type: [DistributorObligationSchema], default: [] },
  totalQuantityDistributed: { type: Number, required: true, min: 0 },
  totalQuantityReturned: { type: Number, required: true, min: 0, default: 0 },
  auditTrail: { type: [AuditEntrySchema], default: [] },
}, { timestamps: true });

export const RecallModel = mongoose.model<RecallDocument>('Recall', RecallSchema);
