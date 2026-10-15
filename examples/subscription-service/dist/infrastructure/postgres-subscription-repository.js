import { randomUUID } from "node:crypto";
const map = (row) => ({ id: row.id, customerId: row.customer_id, planId: row.plan_id, status: row.status, currentPeriodEndsAt: row.current_period_ends_at, gracePeriodEndsAt: row.grace_period_ends_at });
export class PostgresSubscriptionRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async create(input, key) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            // Serialise concurrent retries for this key before checking the cached response.
            await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key]);
            const cached = await client.query("SELECT response FROM idempotency_keys WHERE key = $1", [key]);
            if (cached.rowCount) {
                await client.query("COMMIT");
                return cached.rows[0].response;
            }
            const id = randomUUID();
            const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const result = await client.query("INSERT INTO subscriptions (id, customer_id, plan_id, status, current_period_ends_at) VALUES ($1, $2, $3, 'ACTIVE', $4) RETURNING *", [id, input.customerId, input.planId, endsAt]);
            const subscription = map(result.rows[0]);
            await client.query("INSERT INTO idempotency_keys (key, response) VALUES ($1, $2)", [key, subscription]);
            await client.query("INSERT INTO outbox (id, topic, payload) VALUES ($1, $2, $3)", [randomUUID(), "subscription.created", { subscriptionId: id }]);
            await client.query("COMMIT");
            return subscription;
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    async find(id) {
        const result = await this.pool.query("SELECT * FROM subscriptions WHERE id = $1", [id]);
        return result.rowCount ? map(result.rows[0]) : null;
    }
    async changeStatus(id, status, gracePeriodEndsAt) {
        const result = await this.pool.query("UPDATE subscriptions SET status = $2, grace_period_ends_at = $3, updated_at = now() WHERE id = $1 RETURNING *", [id, status, gracePeriodEndsAt]);
        return map(result.rows[0]);
    }
    async reserveRenewal(subscriptionId, billingPeriod) {
        const result = await this.pool.query("INSERT INTO renewal_attempts (subscription_id, billing_period, status) VALUES ($1, $2, 'PENDING') ON CONFLICT DO NOTHING", [subscriptionId, billingPeriod]);
        return result.rowCount === 1;
    }
    async recordEvent(topic, payload) {
        await this.pool.query("INSERT INTO outbox (id, topic, payload) VALUES ($1, $2, $3)", [randomUUID(), topic, payload]);
    }
}
