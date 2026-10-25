#import "theme.typ": *
#show: branded

#chart(
  spacing: (52pt, 32pt),
  external((3, 0), stack([CUE envelope `c`], [`contracts/system-b.cue`]), name: <constraint>),
  external((4, 0), stack([F], [free generation]), name: <free>),
  external((5, 0), stack([canonical model], [initial, when defined]), name: <initial>),
  step((0, 2), stack([existing system or agent proposal `s`], [`system-b/`]), name: <system>),
  step((1, 2), stack([U], [`adapters/typescript/`]), name: <extract>),
  step((2, 2), stack([CUE projection `U(s)`], [`system-b.gen.cue`]), name: <projection>),
  decision((3, 2), stack([unify], [`U(s) & c`]), name: <unify>),
  step((4, 1), stack([γ(`c`)], [accepted system space]), name: <concretize>),
  annotation((5, 1), [γ(c₁ & c₂) = γ(c₁) ∩ γ(c₂)]),
  step((4, 2), [accepted candidate], name: <accepted>),
  relation(<constraint>, <free>, "-|>", label[optional]),
  relation(<free>, <initial>, "-|>"),
  flow(<system>, <extract>, "-|>", label[observe]),
  flow(<extract>, <projection>, "-|>"),
  flow(<projection>, <unify>, "-|>"),
  flow(<constraint>, <unify>, "-|>", label[constraint]),
  flow(<constraint>, <concretize>, "-|>", label[concretize]),
  flow(<unify>, <accepted>, "-|>", label[compatible]),
  flow(<accepted>, <concretize>, "-|>", label[belongs to]),
  feedback(<unify>, (3, 3.15), (0, 3.15), <system>, "-|>", label[conflict: remediate]),
)
