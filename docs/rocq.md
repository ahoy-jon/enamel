# Rocq integration

This note sketches how Enamel's structural validation can be paired with proof-checked behavioral validation. It is a design direction, not yet a complete formalization.

## Layered verification

Enamel and [Rocq](https://rocq-prover.org/) address different parts of a change:

- **Enamel** uses CUE to check a projection of the system. An adapter expresses observable structure, such as fields, types, bounds, configuration, and relationships, as CUE constraints.
- **Rocq** can validate behavioral properties: for example, that a sorting function returns a sorted permutation, or that a protocol preserves a stated message-delivery property.

Rocq does not replace Enamel's envelope. It adds a stronger, separate validator for the properties that are expressed and proved in Rocq. The same operating principle applies at both layers: a generator may be untrusted, while validation is mechanical and trusted within its stated boundary.

## A possible pipeline

1. State structural intent as CUE constraints.
2. Refine the relevant behavioral intent as a Rocq specification.
3. Let a person or agent propose an implementation and proof.
4. Have the Rocq kernel check the proof.
5. Extract or otherwise compile the verified implementation into executable code.
6. Observe the executable artifact through an Enamel adapter.
7. Check the resulting observation against the CUE envelope.

The extraction step connects a constructive proof to executable code. A proof of an existential statement can contain a witness from which code may be extracted. [rocq-extraction-scala](https://github.com/vbergeron/rocq-extraction-scala) and [Rocq pull request #22541](https://github.com/rocq-prover/rocq/pull/22541) are relevant work on the path from Rocq developments to Scala.

## Composition

At an abstract level, each layer narrows the set of acceptable implementations. Enamel admits artifacts whose CUE projection satisfies the declared structural constraints. Rocq admits programs accompanied by a checked proof of the behavioral proposition.

For a behavioral proposition $\varphi$, this can be written informally as $\gamma_{\mathrm{Rocq}}(\varphi)$: the programs paired with a Rocq proof of $\varphi$. A proof of $\varphi \land \psi$ establishes both properties, so independently proved compatible properties can be combined. The exact interpretation depends on the program model and specifications chosen for the development.

When the relationship between the two specifications is made explicit, the layers can be composed: a candidate must meet the Rocq property and its Enamel projection must meet the CUE constraints. This preserves Enamel's central pattern of independent proposal and deterministic checking. The more general formal model is described in [Adjunctions](adjunctions.md).

## Trust boundary and limits

Adding Rocq moves the trust boundary; it does not eliminate it. The important assumptions should be visible:

- the Rocq kernel and any axioms used by a development;
- the extraction mechanism and target-language compiler;
- the adapter that produces the CUE observation; and
- the correspondence between the Rocq specification and the CUE constraints.

`Print Assumptions` can help make a Rocq development's axioms visible. Standard extraction should not be treated as certified by default. Most importantly, a checked proof of the wrong specification provides no assurance about the intended system. Human review remains necessary at the specification boundary.

## Further work

The next step is to formalize a small example with a stated connection between its Rocq theorem and CUE constraints. That would make the composition claim testable rather than merely architectural.
