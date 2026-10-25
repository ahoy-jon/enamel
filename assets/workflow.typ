#import "theme.typ": *
#show: branded

#chart(
  spacing: (60pt, 20pt),
  external((0, 1), stack([4\. propose], [agent / human]), name: <propose>),
  step((1, 0), stack([System B], [observed part]), name: <system-b>),
  step((1, 2), stack([System C], [observed part]), name: <system-c>),
  step((2, 0), [`system-b.gen.cue`], name: <obs-b>),
  step((2, 2), [`system-c.gen.cue`], name: <obs-c>),
  step((2, 3), stack([constraints], [`scenarios.cue`]), name: <constraints>),
  focus((3, 1), active-stack([2\. compare], [system-b & system-c & scenarios]), name: <compare>),
  decision((4, 1), stack([3\. decide], [accept · govern · remediate]), name: <decide>),
  step((5.5, 1), stack([5\. converged ✓], [constraints satisfied or explicit limit]), name: <converged>),
  relation(<propose>, <system-b>, "--|>", label[targeted change], label-side: left, label-pos: 0.6),
  relation(<propose>, <system-c>, "--|>", label[targeted change], label-side: right, label-pos: 0.6),
  flow(<system-b>, <obs-b>, "-|>", label[1\. observe], label-side: left),
  flow(<system-c>, <obs-c>, "-|>", label[1\. observe], label-side: right),
  flow(<obs-b>, <compare>, "-|>"),
  flow(<obs-c>, <compare>, "-|>"),
  flow(<constraints>, <compare>, "-|>"),
  flow(<compare>, <decide>, "-|>"),
  flow(<decide>, <converged>, "-|>", label[satisfied], label-side: left),
  feedback(<decide>, (4, -.9), (0, -.9), <propose>, "-|>", label[discrepancy: remediate, then observe again]),
)
