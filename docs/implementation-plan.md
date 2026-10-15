# Initial implementation plan

## Goal

Deliver one complete, inspectable loop between a real project and its CUE
model:

1. extract selected facts from a TypeScript project;
2. emit those facts as generated CUE with source provenance;
3. compose them with project-authored concepts and constraints;
4. validate the composition deterministically; and
5. explain failures in terms of the relevant CUE facts and source locations.

The existing [`typescript-lsp-cue`](../examples/typescript-lsp-cue) example is
the initial vertical slice. The work should make its useful conventions
reusable without turning them into a universal ontology or mandatory project
layout.

## Principles

- **Project semantics remain local.** Enamel supplies mechanics for projection,
  composition, validation, provenance, and inspection. A project decides what
  it observes and what its facts mean.
- **Generated observations and authored models are distinct.** An extractor
  owns generated CUE; people own concepts, relationships, and constraints.
- **Every fact has an explicit boundary.** A projection records what it can
  establish, what it omits, and where each observed fact came from.
- **The trusted path is deterministic.** Agents may query evidence and propose
  changes, but extraction and validation must be repeatable for the same
  inputs.
- **Start narrow.** Generalise only after at least two concrete consumers show
  that an abstraction is needed.

## Initial scope

### Supported TypeScript projection

Extend the current LSP example to emit a stable, documented observation for:

- modules and their source paths;
- exported symbols and function signatures already supported by the example;
- local import relationships resolved through LSP; and
- source provenance for every emitted module, symbol, and import fact.

The projection must also include extractor metadata: adapter name and version,
input root, extraction time, and a deterministic input fingerprint. The
fingerprint, rather than the timestamp, is used to decide whether an
observation is stale.

This does **not** expand the initial semantic boundary to include behaviour,
runtime effects, dynamic imports, overloads, generics, visibility, or an
arbitrary TypeScript compiler model. Those omissions remain explicit in the
adapter contract.

### Reusable conventions, not a framework

Document a recommended project structure:

```text
enamel/
  observations/   # generated CUE; never hand-edited
  model/          # project-authored concepts and relationships
  constraints/    # project-authored validation rules
  adapters/       # project-specific extraction configuration or code
```

Projects may use a different layout. The CLI accepts explicit paths and does
not infer semantics from directory names.

Define a small common CUE shape for projection metadata and provenance. Keep
the observed domain data adapter-specific, namespaced, and open-ended. For
example, a TypeScript adapter may emit `observation.typescript`, while a
database adapter may emit `observation.postgres`.

## Tooling milestones

### Milestone 1 — Make the LSP projection reproducible

Refactor `examples/typescript-lsp-cue/tools/extract.ts` only as needed to:

- produce canonical CUE ordering and stable identifiers;
- write to a clearly generated location, such as
  `enamel/observations/typescript.gen.cue`;
- emit provenance for all current facts;
- emit adapter capability and omission metadata; and
- fail with actionable diagnostics when LSP cannot resolve a requested input.

**Acceptance criteria**

- Two extractions of unchanged input produce byte-identical observation facts.
- A checked-in fixture can assert the generated CUE shape.
- A person can follow a generated import or symbol fact back to its source
  file and range.

### Milestone 2 — Add a minimal `enamel` CLI

Implement the CLI in a deliberately small, easily distributed runtime. The
runtime and packaging choice should be made when implementation begins; it
must not require projects to use TypeScript or Deno except when running the
TypeScript adapter.

Initial commands:

| Command | Responsibility |
| --- | --- |
| `enamel extract` | Run configured projection commands and report written observations. |
| `enamel check` | Run extraction when requested, compose selected CUE packages, and validate them with CUE. |
| `enamel explain` | Convert a CUE validation failure into the contributing paths, facts, and available provenance. |
| `enamel diff` | Compare two observation files or revisions and report added, removed, and changed facts. |

Configuration should begin as a small, explicit CUE or YAML file pointing to
commands and paths. It must describe execution, not ontology: adapter-specific
configuration stays with the adapter.

**Acceptance criteria**

- The example can be extracted and checked through the CLI without bespoke
  shell orchestration.
- A known architecture violation identifies the generated import fact, its
  source range, and the violated authored constraint.
- Commands have machine-readable output for agent and CI use, alongside
  readable terminal output.

### Milestone 3 — Semantic diff and staleness checks

Add comparison at the CUE-value level, rather than a textual diff alone:

- classify added, removed, and changed observed facts by stable ID;
- retain provenance in diff output;
- compare an observation's input fingerprint with current inputs; and
- allow CI to fail on stale generated observations.

`enamel diff` initially compares a file with another file or a Git revision.
It does not attempt generic impact analysis; projects can add impact rules in
their authored CUE model later.

**Acceptance criteria**

- A source import change is reported as one semantic relationship change with
  source links.
- A generated observation altered by hand is detected through regeneration or
  fingerprint verification.

### Milestone 4 — Adapter contract and test harness

Provide a lightweight adapter test harness, with:

- input fixtures and expected canonical observations;
- tests for failure diagnostics and declared omissions;
- a compatibility check for changes to stable IDs and emitted shapes; and
- contract documentation generated or validated from adapter metadata.

This is the point to extract reusable libraries from the TypeScript adapter.
Do not define a plugin protocol before this work exposes common requirements.

**Acceptance criteria**

- The TypeScript adapter has fixture-based regression tests.
- An adapter change that removes or renames an observed fact fails unless its
  compatibility impact is deliberately acknowledged.

## Agent integration

Agents should consume the CLI's structured output rather than scrape source
files or terminal text. The first agent-facing operations are:

- list available observations and their stated capabilities;
- query a composed CUE value at an explicit path;
- run `check` and retrieve structured failures;
- use provenance to locate supporting source; and
- produce a proposed change, then re-run extraction and validation.

No agent receives permission to alter generated observations or relax authored
constraints as part of remediation. Constraint changes remain a separately
reviewed operation.

## Deferred work

The following are intentionally outside the first implementation:

- a universal schema or ontology for code, infrastructure, and domains;
- a mandatory plugin system, registry, or remote execution model;
- automatic ontology generation from source code;
- a graphical model editor;
- semantic correctness proofs or replacement of tests and review; and
- generic automatic repair.

## Sequencing and decision points

Implement Milestone 1 before selecting a CLI runtime or configuration format;
the actual observation and provenance needs should constrain those choices.
After Milestone 2, apply the workflow to the subscription-service example. If
the two examples share a real operational need, promote it into the reusable
CLI or adapter contract. Otherwise, keep it project-local.

Success for this first plan is not a broad platform. It is a small loop that a
developer or agent can inspect end-to-end: source change, projected fact,
authored constraint, deterministic result, and source-linked explanation.
