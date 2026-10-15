export const subscriptionStatuses = ["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export type Subscription = {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEndsAt: Date;
  gracePeriodEndsAt: Date | null;
};

export class DomainError extends Error {}

const transitions: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  ACTIVE: ["PAST_DUE", "CANCELLED"],
  PAST_DUE: ["ACTIVE", "EXPIRED", "CANCELLED"],
  CANCELLED: [],
  EXPIRED: [],
};

export function transition(subscription: Subscription, next: SubscriptionStatus): Subscription {
  if (!transitions[subscription.status].includes(next)) {
    throw new DomainError(`Transition ${subscription.status} → ${next} is forbidden`);
  }
  return { ...subscription, status: next };
}

// Failed payment attempts do not immediately revoke an already paid period.
export function markPastDue(subscription: Subscription, now: Date): Subscription {
  const next = transition(subscription, "PAST_DUE");
  return { ...next, gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) };
}
