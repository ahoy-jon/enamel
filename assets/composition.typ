#import "theme.typ": *
#show: branded

#chart(
  spacing: (60pt, 20pt),
  external((0, 1), stack([*Specification*], [OpenAPI]), name: <a>),
  step((1, 0), [System B], name: <b>),
  step((1, 2), [System C], name: <c>),
  step((2, 1), stack([Tests], [unit · integration]), name: <tests>),
  flow(<a>, <b>, "-|>", label[direct dependency], stroke: 1.4pt + navy),
  flow(<a>, <c>, "-|>", label[direct dependency], stroke: 1.4pt + navy, label-side: right),
  relation(<tests>, <b>, "--|>", label[partial coverage], label-side: right),
  relation(<tests>, <c>, "--|>", label[partial coverage]),
  annotation((1, 3), [no shared representation in which to evaluate the whole composition]),
)
