import Fastify from "fastify";
import { DomainError } from "../domain/subscription.js";
export function buildApp(service) {
    const app = Fastify({ logger: true });
    app.post("/subscriptions", async (request, reply) => {
        const key = request.headers["idempotency-key"];
        if (typeof key !== "string" || !request.body?.customerId || !request.body?.planId) {
            return reply.code(400).send({ error: "customerId, planId and Idempotency-Key are required" });
        }
        const subscription = await service.create(request.body, key);
        return reply.code(201).send(subscription);
    });
    app.post("/subscriptions/:id/cancel", async (request, reply) => {
        return reply.send(await service.cancel(request.params.id));
    });
    // In production this route is normally driven by an authenticated payment webhook.
    app.post("/subscriptions/:id/payment-failed", async (request, reply) => {
        const now = request.body?.occurredAt ? new Date(request.body.occurredAt) : new Date();
        if (Number.isNaN(now.getTime()))
            return reply.code(400).send({ error: "occurredAt must be an ISO date" });
        return reply.send(await service.paymentFailed(request.params.id, now));
    });
    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof DomainError)
            return reply.code(409).send({ error: error.message });
        return reply.code(500).send({ error: "Internal server error" });
    });
    return app;
}
