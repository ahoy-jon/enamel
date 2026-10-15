import { DomainError, markPastDue, transition } from "../domain/subscription.js";
export class SubscriptionService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    create(input, idempotencyKey) {
        if (!idempotencyKey)
            throw new DomainError("Idempotency-Key is required");
        return this.repository.create(input, idempotencyKey);
    }
    async cancel(id) {
        const subscription = await this.required(id);
        const next = transition(subscription, "CANCELLED");
        const saved = await this.repository.changeStatus(id, next.status, next.gracePeriodEndsAt);
        await this.repository.recordEvent("subscription.cancelled", { subscriptionId: id });
        return saved;
    }
    async paymentFailed(id, now = new Date()) {
        const subscription = await this.required(id);
        const next = markPastDue(subscription, now);
        const saved = await this.repository.changeStatus(id, next.status, next.gracePeriodEndsAt);
        await this.repository.recordEvent("subscription.past_due", { subscriptionId: id, gracePeriodEndsAt: next.gracePeriodEndsAt });
        return saved;
    }
    // The database uniqueness constraint is the authoritative double-charge guard.
    reserveRenewal(id, billingPeriod) {
        return this.repository.reserveRenewal(id, billingPeriod);
    }
    async required(id) {
        const subscription = await this.repository.find(id);
        if (!subscription)
            throw new DomainError("Subscription not found");
        return subscription;
    }
}
