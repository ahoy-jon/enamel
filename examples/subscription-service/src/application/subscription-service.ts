import { DomainError, markPastDue, transition, type Subscription } from "../domain/subscription.js";
import type { CreateSubscription, SubscriptionRepository } from "./ports.js";

export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  create(input: CreateSubscription, idempotencyKey: string): Promise<Subscription> {
    if (!idempotencyKey) throw new DomainError("Idempotency-Key is required");
    return this.repository.create(input, idempotencyKey);
  }

  async cancel(id: string): Promise<Subscription> {
    const subscription = await this.required(id);
    const next = transition(subscription, "CANCELLED");
    const saved = await this.repository.changeStatus(id, next.status, next.gracePeriodEndsAt);
    await this.repository.recordEvent("subscription.cancelled", { subscriptionId: id });
    return saved;
  }

  async paymentFailed(id: string, now = new Date()): Promise<Subscription> {
    const subscription = await this.required(id);
    const next = markPastDue(subscription, now);
    const saved = await this.repository.changeStatus(id, next.status, next.gracePeriodEndsAt);
    await this.repository.recordEvent("subscription.past_due", { subscriptionId: id, gracePeriodEndsAt: next.gracePeriodEndsAt });
    return saved;
  }

  // The database uniqueness constraint is the authoritative double-charge guard.
  reserveRenewal(id: string, billingPeriod: string): Promise<boolean> {
    return this.repository.reserveRenewal(id, billingPeriod);
  }

  private async required(id: string): Promise<Subscription> {
    const subscription = await this.repository.find(id);
    if (!subscription) throw new DomainError("Subscription not found");
    return subscription;
  }
}
