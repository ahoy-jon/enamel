package subscription

// Human-owned architecture boundary. It describes the components and flows
// whose coordination matters, without claiming to model all implementation.
#Component: {
	role:       string
	ownedState: [...string]
	dependsOn?: [...string]
}

#Flow: {
	from:      string
	to:        string
	guarantee: string
}

#Architecture: {
	components: [string]: #Component
	flows:      [string]: #Flow
	delivery: {
		mode:             "at-least-once"
		deduplicationKey: "event.id"
	}
}

systemArchitecture: #Architecture & {
	components: {
		api: {
			role:       "HTTP command boundary"
			ownedState: []
			dependsOn:  ["application"]
		}
		application: {
			role:       "domain transition coordinator"
			ownedState: ["subscription state-machine rules"]
			dependsOn:  ["repository"]
		}
		repository: {
			role:       "PostgreSQL transaction boundary"
			ownedState: ["subscriptions", "idempotency keys", "outbox"]
			dependsOn:  ["postgres"]
		}
		worker: {
			role:       "outbox publisher"
			ownedState: []
			dependsOn:  ["postgres", "nats"]
		}
	}
	flows: {
		stateChange: {
			from:      "application"
			to:        "repository"
			guarantee: "subscription mutation and outbox insert commit atomically"
		}
		publication: {
			from:      "worker"
			to:        "nats"
			guarantee: "at-least-once delivery; consumers deduplicate by event.id"
		}
	}
}
