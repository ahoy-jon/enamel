import type { Subscription, SubscriptionStatus } from "../domain/subscription.js";

export type CreateSubscription = { customerId: string; planId: string };
export type OutboxEvent = { topic: string; payload: object };

export interface SubscriptionRepository {
  create(input: CreateSubscription, idempotencyKey: string): Promise<Subscription>;
  find(id: string): Promise<Subscription | null>;
  changeStatusAndRecordEvent(
    id: string,
    status: SubscriptionStatus,
    gracePeriodEndsAt: Date | null,
    event: OutboxEvent,
  ): Promise<Subscription>;
  reserveRenewal(subscriptionId: string, billingPeriod: string): Promise<boolean>;
}
