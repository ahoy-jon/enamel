import { subscriptionStatuses } from "../domain/subscription.js";
import type { DatabaseObservation } from "../infrastructure/observe-postgres.js";

// Human-owned rules at the boundary between the domain model and persistence.
// Importing the runtime domain states is deliberate: adding an application state
// without a matching PostgreSQL enum migration becomes a failing evidence check.
const expectedColumns: Record<string, readonly string[]> = {
  subscriptions: ["id", "customer_id", "plan_id", "status", "current_period_ends_at", "grace_period_ends_at", "created_at", "updated_at"],
  idempotency_keys: ["key", "response", "created_at"],
  renewal_attempts: ["subscription_id", "billing_period", "status", "created_at"],
  outbox: ["id", "topic", "payload", "created_at", "published_at"],
};

const requiredConstraints = [
  "PRIMARY KEY (id)",
  "PRIMARY KEY (key)",
  "PRIMARY KEY (subscription_id, billing_period)",
  "FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)",
];

export function verifyDatabaseContract(observation: DatabaseObservation): string[] {
  const violations: string[] = [];
  for (const [table, columns] of Object.entries(expectedColumns)) {
    const observed = observation.columns[table] ?? [];
    for (const column of columns) {
      if (!observed.includes(column)) violations.push(`Missing ${table}.${column}`);
    }
  }

  const enumValues = observation.enums.subscription_status ?? [];
  if (JSON.stringify(enumValues) !== JSON.stringify(subscriptionStatuses)) {
    violations.push(`subscription_status must equal domain states: ${subscriptionStatuses.join(", ")}`);
  }

  for (const constraint of requiredConstraints) {
    if (!observation.constraints.some((observed) => observed.definition === constraint)) {
      violations.push(`Missing database constraint: ${constraint}`);
    }
  }
  return violations;
}
