import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { CreateSubscription, OutboxEvent, SubscriptionRepository } from "../application/ports.js";
import type { Subscription, SubscriptionStatus } from "../domain/subscription.js";

type Row = { id: string; customer_id: string; plan_id: string; status: SubscriptionStatus; current_period_ends_at: Date; grace_period_ends_at: Date | null };
type CachedSubscription = Omit<Subscription, "currentPeriodEndsAt" | "gracePeriodEndsAt"> & {
  currentPeriodEndsAt: string;
  gracePeriodEndsAt: string | null;
};
const map = (row: Row): Subscription => ({ id: row.id, customerId: row.customer_id, planId: row.plan_id, status: row.status, currentPeriodEndsAt: row.current_period_ends_at, gracePeriodEndsAt: row.grace_period_ends_at });
const cache = (subscription: Subscription): CachedSubscription => ({
  ...subscription,
  currentPeriodEndsAt: subscription.currentPeriodEndsAt.toISOString(),
  gracePeriodEndsAt: subscription.gracePeriodEndsAt?.toISOString() ?? null,
});
const restore = (subscription: CachedSubscription): Subscription => ({
  ...subscription,
  currentPeriodEndsAt: new Date(subscription.currentPeriodEndsAt),
  gracePeriodEndsAt: subscription.gracePeriodEndsAt ? new Date(subscription.gracePeriodEndsAt) : null,
});

export class PostgresSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateSubscription, key: string): Promise<Subscription> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Serialise concurrent retries for this key before checking the cached response.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key]);
      const cached = await client.query<{ response: CachedSubscription }>("SELECT response FROM idempotency_keys WHERE key = $1", [key]);
      if (cached.rowCount) { await client.query("COMMIT"); return restore(cached.rows[0].response); }
      const id = randomUUID();
      const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const result = await client.query<Row>("INSERT INTO subscriptions (id, customer_id, plan_id, status, current_period_ends_at) VALUES ($1, $2, $3, 'ACTIVE', $4) RETURNING *", [id, input.customerId, input.planId, endsAt]);
      const subscription = map(result.rows[0]);
      await client.query("INSERT INTO idempotency_keys (key, response) VALUES ($1, $2)", [key, cache(subscription)]);
      await client.query("INSERT INTO outbox (id, topic, payload) VALUES ($1, $2, $3)", [randomUUID(), "subscription.created", { subscriptionId: id }]);
      await client.query("COMMIT");
      return subscription;
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async find(id: string): Promise<Subscription | null> {
    const result = await this.pool.query<Row>("SELECT * FROM subscriptions WHERE id = $1", [id]);
    return result.rowCount ? map(result.rows[0]) : null;
  }

  async changeStatusAndRecordEvent(id: string, status: SubscriptionStatus, gracePeriodEndsAt: Date | null, event: OutboxEvent): Promise<Subscription> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<Row>("UPDATE subscriptions SET status = $2, grace_period_ends_at = $3, updated_at = now() WHERE id = $1 RETURNING *", [id, status, gracePeriodEndsAt]);
      await client.query("INSERT INTO outbox (id, topic, payload) VALUES ($1, $2, $3)", [randomUUID(), event.topic, event.payload]);
      await client.query("COMMIT");
      return map(result.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async reserveRenewal(subscriptionId: string, billingPeriod: string): Promise<boolean> {
    const result = await this.pool.query("INSERT INTO renewal_attempts (subscription_id, billing_period, status) VALUES ($1, $2, 'PENDING') ON CONFLICT DO NOTHING", [subscriptionId, billingPeriod]);
    return result.rowCount === 1;
  }
}
