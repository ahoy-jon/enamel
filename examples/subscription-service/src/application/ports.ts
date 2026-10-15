import type { Subscription, SubscriptionStatus } from "../domain/subscription.js";

export type CreateSubscription = { customerId: string; planId: string };

export interface SubscriptionRepository {
  create(input: CreateSubscription, idempotencyKey: string): Promise<Subscription>;
  find(id: string): Promise<Subscription | null>;
  changeStatus(id: string, status: SubscriptionStatus, gracePeriodEndsAt: Date | null): Promise<Subscription>;
  reserveRenewal(subscriptionId: string, billingPeriod: string): Promise<boolean>;
  recordEvent(topic: string, payload: object): Promise<void>;
}
