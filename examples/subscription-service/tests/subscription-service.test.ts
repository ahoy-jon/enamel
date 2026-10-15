import { describe, expect, it } from "vitest";
import { SubscriptionService } from "../src/application/subscription-service.js";
import type { CreateSubscription, SubscriptionRepository } from "../src/application/ports.js";
import type { Subscription, SubscriptionStatus } from "../src/domain/subscription.js";

class MemoryRepository implements SubscriptionRepository {
  readonly subscriptions = new Map<string, Subscription>();
  readonly events: { topic: string; payload: object }[] = [];
  readonly renewals = new Set<string>();
  async create(input: CreateSubscription): Promise<Subscription> {
    const subscription: Subscription = { id: "sub_1", ...input, status: "ACTIVE", currentPeriodEndsAt: new Date("2026-02-01"), gracePeriodEndsAt: null };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }
  async find(id: string) { return this.subscriptions.get(id) ?? null; }
  async changeStatus(id: string, status: SubscriptionStatus, gracePeriodEndsAt: Date | null) {
    const current = this.subscriptions.get(id)!;
    const next = { ...current, status, gracePeriodEndsAt };
    this.subscriptions.set(id, next);
    return next;
  }
  async reserveRenewal(id: string, period: string) { const key = `${id}:${period}`; if (this.renewals.has(key)) return false; this.renewals.add(key); return true; }
  async recordEvent(topic: string, payload: object) { this.events.push({ topic, payload }); }
}

describe("subscription invariants", () => {
  it("keeps access for seven days after a failed payment", async () => {
    const repository = new MemoryRepository();
    const service = new SubscriptionService(repository);
    await service.create({ customerId: "cus_1", planId: "pro" }, "create-1");

    const result = await service.paymentFailed("sub_1", new Date("2026-01-01T00:00:00Z"));

    expect(result.status).toBe("PAST_DUE");
    expect(result.gracePeriodEndsAt).toEqual(new Date("2026-01-08T00:00:00Z"));
    expect(repository.events[0].topic).toBe("subscription.past_due");
  });

  it("reserves each billing period only once", async () => {
    const service = new SubscriptionService(new MemoryRepository());
    await expect(service.reserveRenewal("sub_1", "2026-01-01")).resolves.toBe(true);
    await expect(service.reserveRenewal("sub_1", "2026-01-01")).resolves.toBe(false);
  });

  it("does not permit a cancelled subscription to be cancelled again", async () => {
    const repository = new MemoryRepository();
    const service = new SubscriptionService(repository);
    await service.create({ customerId: "cus_1", planId: "pro" }, "create-1");
    await service.cancel("sub_1");
    await expect(service.cancel("sub_1")).rejects.toThrow("forbidden");
  });
});
