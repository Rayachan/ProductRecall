export const Topics = {
  RECALL_INITIATED: 'guardian.recall.initiated',
  NOTIFICATIONS_SENT: 'guardian.notifications.sent',
  DISTRIBUTOR_ACKNOWLEDGED: 'guardian.distributor.acknowledged',
  RETURNS_UPDATED: 'guardian.returns.updated',
  RETURNS_IN_PROGRESS: 'guardian.returns.in_progress',
  RECALL_CLOSED: 'guardian.recall.closed',
} as const;

export type Topic = typeof Topics[keyof typeof Topics];
