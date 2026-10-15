#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let blue = rgb("#2563eb")
#let orange = rgb("#d97706")
#let red = rgb("#dc2626")
#let green = rgb("#16a34a")
#let muted = luma(100)
#set page(width: auto, height: auto, margin: 24pt, fill: rgb("#fbfcfe"))
#set text(font: "Helvetica", size: 13pt)

#let sys(body) = text(fill: blue, body)
#let tf = text(11pt, fill: blue)[transform / filter]
#let edit = text(10pt, fill: orange)[edit?]

#diagram(
  spacing: (34pt, 22pt),
  node-stroke: 1pt,
  node-corner-radius: 6pt,
  node-inset: 10pt,
  node((0, 0), align(center)[#sys[Specification] \ #text(10pt, fill: blue)[OpenAPI]], name: <a>, stroke: 1pt + blue),
  node((0, 1), sys[System B], name: <b>, stroke: 1pt + blue),
  node((0, 2), sys[System C], name: <c>, stroke: 1pt + blue),
  node((2, 0), [Contracts / observations A], name: <contracts-a>),
  node((2, 1), [Contracts / observations B], name: <contracts-b>),
  node((2, 2), [Contracts / observations C], name: <contracts-c>),
  node((2, 3), sys[Shared rules], name: <rules>, stroke: 1pt + blue),
  node((2, 4), [*Validation* · deterministic], name: <validation>, stroke: none),
  node(enclose: (<contracts-a>, <contracts-b>, <contracts-c>, <rules>, <validation>), stroke: 1.2pt, corner-radius: 10pt, inset: 10pt, name: <harness>),
  node((2, -.62), text(11pt, weight: "bold", fill: blue)[symbolic envelope], stroke: none),
  node((1, 0), tf, name: <transform-a>, stroke: (paint: blue, dash: "dotted"), inset: 6pt),
  node((1, 1), tf, name: <transform-b>, stroke: (paint: blue, dash: "dotted"), inset: 6pt),
  node((1, 2), tf, name: <transform-c>, stroke: (paint: blue, dash: "dotted"), inset: 6pt),
  edge(<a>, <transform-a>, "-"),
  edge(<transform-a>, <contracts-a>, "-|>"),
  edge(<b>, <transform-b>, "-"),
  edge(<transform-b>, <contracts-b>, "-|>"),
  edge(<c>, <transform-c>, "-"),
  edge(<transform-c>, <contracts-c>, "-|>"),
  node((1, 5.2), align(center)[#text(fill: orange)[remediation loop] \ #text(11pt, fill: orange)[agent / human]], name: <remediation>, stroke: 1.2pt + orange),
  node((3.2, 5.2), text(fill: green)[unified ✓], name: <ok>, stroke: none),
  edge(<harness.south>, (2, 5.2), <remediation.east>, "-|>", text(11pt, fill: red)[errors], stroke: red, label-side: left),
  edge(<harness>, <ok>, "-|>", stroke: green),
  node(enclose: (<a>, <b>, <c>, <transform-a>, <transform-b>, <transform-c>), stroke: (paint: orange, dash: "dashed"), corner-radius: 10pt, inset: 8pt, name: <inputs>),
  edge(<remediation>, <inputs>, "--|>", text(10pt, fill: orange)[edit? systems · transforms · specification], stroke: orange, label-side: left),
  edge(<remediation>, <rules>, "--|>", edit, stroke: orange, label-side: right),
)
