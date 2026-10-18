CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status subscription_status NOT NULL,
  current_period_ends_at TIMESTAMPTZ NOT NULL,
  grace_period_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE renewal_attempts (
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  billing_period DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (subscription_id, billing_period)
);

CREATE TABLE outbox (
  id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
