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

`mise run check` regenerates the observation and runs `cue vet .`. Change one
of the observed function signatures in `src/` and validation fails until the
implementation is repaired or the intended contract is deliberately updated.

## Adapter boundary

The adapter requests document symbols and hover signatures for the explicit
files in `deno.json`. It records function names, parameter names/types, return
types (with `Promise<T>` represented structurally), and whether the return type
is `Promise<T>`. It does not establish
function behavior, runtime effects, overloads, generics, or visibility. The
small hover parser intentionally makes its supported signature subset explicit.
