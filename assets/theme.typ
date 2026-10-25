#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node

#let navy = rgb("#0f172a")
#let white = rgb("#ffffff")
#let gray = rgb("#64748b")
#let light = rgb("#cbd5e1")
#let infra = rgb("#f1f5f9")

#let branded(body) = {
  set page(width: auto, height: auto, margin: 24pt, fill: white)
  set text(font: "Roboto", size: 11pt, fill: navy)
  body
}

#let label(body) = text(font: "JetBrains Mono", size: 8pt, fill: gray, body)
#let mono(body) = label(body)
#let active-label(body) = text(font: "JetBrains Mono", size: 8pt, fill: light, body)
#let active-title(body) = text(fill: white, weight: "bold", body)
#let title(body) = text(weight: "bold", body)

#let stack(main, sub) = align(center)[#main \ #label(sub)]
#let active-stack(main, sub) = align(center)[#active-title(main) \ #active-label(sub)]

#let chart(..args) = diagram(
  node-stroke: 0.9pt,
  node-corner-radius: 0pt,
  node-inset: 9pt,
  label-size: 8pt,
  ..args,
)

#let step(pos, body, ..args) = node(
  pos,
  body,
  stroke: 0.9pt + navy,
  fill: white,
  shape: rect,
  corner-radius: 0pt,
  ..args,
)

#let focus(pos, body, ..args) = node(
  pos,
  body,
  stroke: 0.9pt + navy,
  fill: navy,
  shape: rect,
  corner-radius: 0pt,
  ..args,
)

#let external(pos, body, ..args) = node(
  pos,
  body,
  stroke: (paint: gray, thickness: 0.9pt, dash: "dashed"),
  fill: white,
  shape: rect,
  corner-radius: 0pt,
  ..args,
)

#let infrastructure(pos, body, ..args) = node(
  pos,
  body,
  stroke: 0.9pt + light,
  fill: infra,
  shape: rect,
  corner-radius: 0pt,
  ..args,
)

#let decision(pos, body, ..args) = node(
  pos,
  body,
  shape: fletcher.shapes.diamond,
  stroke: 0.9pt + navy,
  fill: white,
  inset: 6pt,
  ..args,
)

#let annotation(pos, body, ..args) = node(
  pos,
  label(body),
  stroke: none,
  ..args,
)

#let group(items, ..args) = node(
  enclose: items,
  stroke: 0.9pt + navy,
  corner-radius: 0pt,
  inset: 10pt,
  ..args,
)

#let external-group(items, ..args) = node(
  enclose: items,
  stroke: (paint: gray, thickness: 0.9pt, dash: "dashed"),
  corner-radius: 0pt,
  inset: 10pt,
  ..args,
)

#let flow(..args) = edge(label-fill: true, ..args, stroke: 0.9pt + navy)
#let relation(..args) = edge(label-fill: true, ..args, stroke: (paint: gray, thickness: 0.9pt, dash: "dashed"))
#let feedback(..args) = edge(label-fill: true, ..args, stroke: 0.9pt + navy)
