#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let blue = rgb("#2563eb")
#let teal = rgb("#0e7490")
#let purple = rgb("#9333ea")
#let muted = luma(100)
#set page(width: auto, height: auto, margin: 24pt, fill: rgb("#fbfcfe"))
#set text(font: "Helvetica", size: 13pt)

#let label(text-body) = text(10pt, fill: muted, text-body)

#diagram(
  spacing: (46pt, 20pt),
  node-stroke: .9pt,
  node-corner-radius: 5pt,
  node-inset: 9pt,
  node((0, 1), align(center)[Agentic generation], name: <agent>, stroke: (dash: "dashed")),
  node((1, 0), align(center)[System B \ #label[(observed part)]], name: <system-a>),
  node((1, 2), align(center)[System C \ #label[(observed part)]], name: <system-b>),
  node((2, 0), text(fill: teal)[`system-b.gen.cue`], name: <extract-a>, stroke: teal),
  node((2, 2), text(fill: teal)[`system-c.gen.cue`], name: <extract-b>, stroke: teal),
  node((2, 3), [`scenarios.cue`], name: <scenarios>),
  node((3, 1), align(center)[#text(fill: blue)[System B ∩ System C ∩ scenarios] \ #label[compatibility check]], name: <meet>, stroke: blue),
  node((4, 1), align(center)[converges? \ #label[meet ≠ ⊥]], name: <converges>, shape: fletcher.shapes.diamond, stroke: blue, inset: 6pt),
  node((5, 1), align(center)[#text(fill: purple)[fixpoint ✓] \ #label[compatibility validated]], name: <fixpoint>, stroke: purple),
  edge(<agent>, <system-a>, "--|>", label[generates / updates]),
  edge(<agent>, <system-b>, "--|>", label[generates / updates], label-side: right),
  edge(<system-a>, <extract-a>, "-|>", label[extract]),
  edge(<system-b>, <extract-b>, "-|>", label[extract], label-side: right),
  edge(<extract-a>, <meet>, "-|>"),
  edge(<extract-b>, <meet>, "-|>"),
  edge(<scenarios>, <meet>, "-|>"),
  edge(<meet>, <converges>, "-|>", label[validate]),
  edge(<converges>, <fixpoint>, "-|>", label[yes]),
  edge(<converges>, (4, -.9), (0, -.9), <agent>, "-|>", label[no: regenerate targeted fragments]),
)
