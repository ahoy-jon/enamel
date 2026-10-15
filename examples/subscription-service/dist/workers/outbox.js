import { connect } from "nats";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const nats = await connect({ servers: process.env.NATS_URL ?? "nats://localhost:4222" });
async function publishBatch() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // SKIP LOCKED permits several workers without publishing an event twice.
        const events = await client.query("SELECT id, topic, payload FROM outbox WHERE published_at IS NULL ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 100");
        for (const event of events.rows) {
            nats.publish(event.topic, new TextEncoder().encode(JSON.stringify(event.payload)));
            await nats.flush();
            await client.query("UPDATE outbox SET published_at = now() WHERE id = $1", [event.id]);
        }
        await client.query("COMMIT");
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
const timer = setInterval(() => { void publishBatch().catch(console.error); }, 500);
void publishBatch().catch(console.error);
const shutdown = async () => { clearInterval(timer); await nats.drain(); await pool.end(); };
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
