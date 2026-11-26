# Rocq model of the envelope

A Rocq formalization of the model in [Adjunctions](../docs/adjunctions.md):
extraction U, concretization γ and free generation F, with F ⊣ U ⊣ γ.

```text
rocq/
  TripleAdjonction.v  the model (comments in French)
  Limits.v            proofs behind each limit in docs/formal-limits.md
  _CoqProject         logical path Enamel
```

## What `TripleAdjonction.v` covers

1. Adjunctions between preorders and the triple adjunction F ⊣ U ⊣ γ. Right
   adjoints keep meets, left adjoints keep joins.
2. Horn clauses: the least model exists and is unique, so F is defined.
3. Disjunction (CUE `|`): two minimal models and no least model, so F does
   not exist.
4. CUE constraints as a meet semilattice: γ(c₁ & c₂) = γ(c₁) ∩ γ(c₂), the
   order of constraints does not matter, and generate-and-check with any
   generator (an LLM) only returns valid systems.

The model checks a system by subsumption, but Enamel checks it by
compatibility (`cue vet`). These are not the same when observations are
partial. Read [the limits](../docs/formal-limits.md) before you rely on these
results.

## Build

With Rocq 9.x and its Stdlib:

```sh
mise run check-rocq    # from the repository root
# or, by hand:
cd rocq
rocq makefile -f _CoqProject -o Makefile && make
```

`Print Assumptions` at the end of each file prints
`Closed under the global context`. The CUE laws are section hypotheses, not
axioms.
