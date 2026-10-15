package subscription

// Human-owned service envelope. It is intentionally smaller than the codebase:
// it specifies the properties a proposed change must preserve.
service: {
	name: "subscription-service"
	api: [
		"POST /subscriptions",
		"POST /subscriptions/{id}/cancel",
		"POST /subscriptions/{id}/payment-failed",
	]
	dependencies: ["PostgreSQL", "NATS"]
	slo: {
		availability: ">= 99.9%"
		latencyP95:  "<= 300ms (without payment provider call)"
	}
	invariants: [
		"A billing period is charged at most once.",
		"A cancelled or expired subscription cannot transition again.",
		"A payment failure retains access for a seven-day grace period.",
		"Create requests are idempotent by Idempotency-Key.",
	]
	decision: "PostgreSQL transaction + outbox, not a distributed transaction"
	evidence: [
		"tests/subscription-service.test.ts",
		"tests/integration/postgres-invariants.test.ts observes the migrated database",
		"migrations/001_initial.sql unique primary key on renewal_attempts",
		"outbox worker uses FOR UPDATE SKIP LOCKED",
	]
}
