import { readFile } from "node:fs/promises";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresSubscriptionRepository } from "../../src/infrastructure/postgres-subscription-repository.js";
import { verifyDatabaseContract } from "../../src/enamel/database-contract.js";
import { observePostgres } from "../../src/infrastructure/observe-postgres.js";

describe("PostgreSQL evidence", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let repository: PostgresSubscriptionRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("subscriptions")
      .withUsername("app")
      .withPassword("app")
      .start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    const migration = await readFile(new URL("../../migrations/001_initial.sql", import.meta.url), "utf8");
    await pool.query(migration);
    repository = new PostgresSubscriptionRepository(pool);
  }, 60_000);

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  it("makes the migrated schema satisfy the domain persistence contract", async () => {
    const observation = await observePostgres(pool);
    expect(verifyDatabaseContract(observation)).toEqual([]);
  });

  it("replays concurrent create requests with the same idempotency key", async () => {
    const [first, replay] = await Promise.all([
      repository.create({ customerId: "cus_1", planId: "pro" }, "key-42"),
      repository.create({ customerId: "cus_1", planId: "pro" }, "key-42"),
    ]);

    expect(replay.id).toBe(first.id);
    const count = await pool.query<{ count: string }>("SELECT count(*) FROM subscriptions");
    expect(count.rows[0].count).toBe("1");
  });

  it("allows only one renewal reservation for a billing period", async () => {
    const subscription = await repository.create({ customerId: "cus_2", planId: "pro" }, "key-43");

    await expect(repository.reserveRenewal(subscription.id, "2026-01-01")).resolves.toBe(true);
    await expect(repository.reserveRenewal(subscription.id, "2026-01-01")).resolves.toBe(false);
  });
});
