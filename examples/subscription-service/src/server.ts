import { Pool } from "pg";
import { buildApp } from "./api/app.js";
import { SubscriptionService } from "./application/subscription-service.js";
import { PostgresSubscriptionRepository } from "./infrastructure/postgres-subscription-repository.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new SubscriptionService(new PostgresSubscriptionRepository(pool));
const app = buildApp(service);

const port = Number(process.env.PORT ?? 3000);
await app.listen({ host: "0.0.0.0", port });

const shutdown = async () => {
  await app.close();
  await pool.end();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
