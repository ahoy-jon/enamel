# TypeScript LSP → CUE envelope

This small Enamel example observes TypeScript through
[`typescript-language-server`](https://github.com/typescript-language-server/typescript-language-server)
over LSP. The Deno adapter writes `extract.gen.cue`; CUE then unifies that
observation with the human-owned intent in `spec.cue` and the extractor rules
in `rules.cue`.

[Multilspy](https://github.com/microsoft/multilspy) is a Python LSP client that
can drive the same server. This example uses a tiny Deno LSP client instead, so
the adapter, its requests, and its generated CUE are all local and inspectable.

## Run

```sh
mise install
npm install
mise run check
```

`mise run check` regenerates the observation and runs `cue vet .`. It validates
both signatures and a layered dependency policy:

```text
presentation → application → data → infrastructure
                   ↓          ↓
                 domain ←─────┘
```

For example, changing `src/presentation/greetingHandler.ts` to import the
repository or database directly makes CUE reject the observation. The policy is
human-owned in `architecture.cue`; the actual local import targets are resolved
by `textDocument/definition` and emitted in `extract.gen.cue`.

## Adapter boundary

The adapter requests document symbols and hover signatures for the explicit
files in `deno.json`. It records function names, parameter names/types, return
types (with `Promise<T>` represented structurally), local module dependencies
resolved through LSP definitions, and whether the return type is `Promise<T>`.
It does not establish function behavior, runtime effects, dynamic imports,
overloads, generics, or visibility. The small hover parser and import discovery
intentionally make the supported subset explicit.
