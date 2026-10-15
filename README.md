# Enamel

**A shared, inspectable boundary between specifications, systems, and agents.**

Enamel helps people and agents change real systems with evidence rather than guesswork. It creates a **translucent** view of a codebase, infrastructure stack, or running service: enough verified structure to steer and validate a change, without pretending to model every implementation detail.

Instead of choosing between an opaque system and an exhaustive model that will inevitably drift, Enamel makes the relevant boundary explicit:

- **intent** — what the system should do;
- **observation** — what an adapter can reliably see about it;
- **constraints** — the rules those observations must satisfy; and
- **proposals** — changes that can be checked against those rules.

The result is a common space where specifications, implementations, and agent-generated changes can be compared without treating any one of them as the whole truth.

> Expose enough of a system to steer change with evidence, without pretending to know the whole system.

## Why translucency?

Agents need dependable context, but complete representations of real systems are costly to construct, quickly become stale, and still miss important behavior. Partial context alone is not sufficient either: without clear meaning and limits, it can create false confidence.

A translucent interface states what it observes, what those observations mean, which constraints they can support, and what remains unknown. This makes uncertainty inspectable. It also helps reconcile the three views that commonly drift apart: the intended specification, the observable state of the system, and the changes proposed by agents.

## How it works

### 1. Direct dependencies make evolution brittle

![Legacy workflow: systems depend directly on each other's definitions.](assets/build/composition.svg)

In a direct model, an interface definition such as OpenAPI drives downstream systems. Tests capture part of the relationship, but there is no independent representation in which to evaluate the whole composition. Changing one system therefore tends to tightly constrain the others.

### 2. A symbolic envelope provides a shared boundary

![Symbolic harness: systems are transformed into observations and unified with rules for deterministic validation.](assets/build/symbolic-harness.svg)

Enamel introduces a **symbolic envelope**: adapters transform each system into contracts and observations, then shared rules unify those representations. Downstream systems may evolve independently when their observations continue to satisfy the envelope. Agents work against that same boundary rather than relying on either the specification or implementation alone.

### 3. Change converges through a bounded loop

![Convergence loop: observe, constrain, decide, remediate, and re-observe.](assets/build/workflow.svg)

1. **Observe** the system through an adapter.
2. **Compare** that observation with the intended constraints.
3. **Decide** whether the discrepancy is acceptable, requires a governed constraint change, or needs remediation.
4. **Propose and validate** a targeted change.
5. **Observe again** until the constraints are satisfied or the process reaches its explicit limit.

Adapters may use source analysis, schemas, compiler APIs, language servers, runtime introspection, or traces. There is no universal extraction mechanism. For unchanged input, an adapter should produce the same canonical observation.

## Design principles

### Adapters have explicit contracts

An adapter extracts an observable specification from a system. Its contract defines what it represents faithfully, what it omits, and which guarantees its output can support.

### Validation is deterministic

Generation may be probabilistic; validation must not be. Enamel represents expectations as composable constraints so a proposal can be checked against an explicit contract.

### Convergence is iterative

Complex systems rarely yield to a single generation step. Enamel identifies a discrepancy, proposes a focused remediation, then re-observes and re-validates the resulting system.

### Constraint changes are governed

Adding a constraint narrows the set of accepted configurations; removing or relaxing one expands it. Those are distinct operations. An agent must not silently weaken the contract merely to eliminate a failure.

## What Enamel can—and cannot—establish

Enamel keeps three separate questions separate:

1. **Extraction fidelity** — Does an adapter observe the properties it claims to observe?
2. **Validation composability** — Do the declared constraints combine predictably?
3. **Generation feasibility** — Can a proposed change bring the system into conformance without violating existing invariants?

Answers depend on the system and its adapter. A structurally valid observation is not proof of behavioral correctness, safe execution, or successful convergence.

Enamel is not a complete model of every system, a claim that an LLM can determine correctness unaided, a replacement for domain-specific tests and review, or a universal extractor based on one protocol or language service.

## Example: coinductive repair

[Coinductive Repair](https://github.com/stratorys/coinductive-repair) illustrates the remediation pattern Enamel supports: validate a candidate system, identify a discrepancy, apply a targeted repair, and validate again until the composition reaches a stable state.

In Enamel, this loop is bounded by the symbolic envelope. A repair is accepted because the resulting observations satisfy shared constraints—not simply because it removes a local error.

## Intellectual context

Enamel is aligned with Peter Naur’s *Programming as Theory Building*: meaningful understanding must remain available as a system evolves. It proposes a technical complement rather than a replacement for human understanding—a semantic harness that exposes relevant structure without prescribing implementation.

It also explores questions raised by Harvard’s [Future of Programming](https://future.metareflection.club/syllabus.html) seminar: how to express intent to computers, collaborate with AI, and retain justified trust in systems shaped by AI. Enamel is one possible technical approach, not a general solution.

## Diagrams

The diagram sources live in [`assets/`](assets/). Rebuild them with:

```sh
mise install
mise run build-assets
```

## Status

Enamel is a design-stage project. This repository will develop the shared model, adapter contracts, constraint representation, and convergence workflow described here.

## References

- [CUE language](https://cuelang.org/)
- [Meta-Reflection Club](https://future.metareflection.club/)
  - [Syllabus](https://future.metareflection.club/syllabus.html)
  - [Schedule](https://future.metareflection.club/schedule.html)
- Peter Naur, [*Programming as Theory Building*](https://doi.org/10.1093/comjnl/28.3.253), *The Computer Journal*, 1985
- [Coinductive Repair](https://github.com/stratorys/coinductive-repair)
