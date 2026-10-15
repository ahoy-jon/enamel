#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let blue = rgb("#2563eb")
#let teal = rgb("#0e7490")
#let purple = rgb("#9333ea")
#let muted = luma(100)
#set page(width: auto, height: auto, margin: 24pt, fill: rgb("#fbfcfe"))
#set text(font: "Helvetica", size: 13pt)

#let label(text-body) = text(10pt, fill: muted, text-body)

#diagram(
  spacing: (52pt, 32pt),
  node-stroke: .9pt,
  node-corner-radius: 5pt,
  node-inset: 9pt,
  node((3, 0), align(center)[#text(fill: blue)[CUE envelope] \ #label[`contracts/system-b.cue`]], name: <constraint>, stroke: blue),
  node((4, 0), align(center)[#text(fill: purple)[F] \ #label[free generation]], name: <free>, stroke: purple),
  node((5, 0), align(center)[canonical model \ #label[initial, when defined]], name: <initial>, stroke: purple),
  node((0, 2), align(center)[existing system or \ agent proposal \ #label[`system-b/`]], name: <system>),
  node((1, 2), align(center)[#text(fill: teal)[U] \ #label[`adapters/typescript/`]], name: <extract>, stroke: teal),
  node((2, 2), align(center)[CUE projection \ #label[`system-b.gen.cue`]], name: <projection>, stroke: teal),
  node((3, 2), align(center)[unify \ #label[`O & c`]], name: <unify>, shape: fletcher.shapes.diamond, stroke: blue, inset: 6pt),
  node((4, 1), align(center)[#text(fill: purple)[gamma(`c`)] \ #label[accepted system space]], name: <concretize>, stroke: purple),
  node((4, 2), align(center)[accepted candidate], name: <accepted>, stroke: purple),
  edge(<constraint>, <free>, "-|>", label[optional]),
  edge(<free>, <initial>, "-|>"),
  edge(<system>, <extract>, "-|>"),
  edge(<extract>, <projection>, "-|>"),
  edge(<projection>, <unify>, "-|>"),
  edge(<constraint>, <unify>, "-|>", label[constraint]),
  edge(<constraint>, <concretize>, "-|>", label[concretize]),
  edge(<unify>, <accepted>, "-|>", label[compatible]),
  edge(<accepted>, <concretize>, "-|>", label[belongs to]),
  edge(<unify>, (3, 3.15), (0, 3.15), <system>, "-|>", label[conflict: remediate]),
)
