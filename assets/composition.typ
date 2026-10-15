#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let blue = rgb("#2563eb")
#let green = rgb("#16a34a")
#let muted = luma(100)
#set page(width: auto, height: auto, margin: 24pt, fill: rgb("#fbfcfe"))
#set text(font: "Helvetica", size: 13pt)

#diagram(
  spacing: (60pt, 20pt),
  node-stroke: 1pt,
  node-corner-radius: 6pt,
  node-inset: 10pt,
  node((0, 1), align(center)[*Specification* \ #text(11pt, fill: blue)[OpenAPI]], name: <a>, stroke: blue),
  node((1, 0), [System B], name: <b>),
  node((1, 2), [System C], name: <c>),
  node((2, 1), align(left)[*Tests* \ #text(11pt)[unit · integration]], name: <tests>, stroke: green),
  edge(<a>, <b>, "-|>", text(10pt, fill: muted)[definition]),
  edge(<a>, <c>, "-|>", text(10pt, fill: muted)[definition]),
  edge(<tests>, <b>, "--|>"),
  edge(<tests>, <c>, "--|>"),
  node((2, 2.4), text(11pt, fill: muted)[direct dependencies make independent evolution difficult], stroke: none),
)
